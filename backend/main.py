import pandas as pd
import numpy as np
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel #Handles the data validation layer, ensuring that incoming JSON requests match the feature schema required by model.
from fastapi.middleware.cors import CORSMiddleware
import joblib
from dotenv import load_dotenv
from fastapi import Body, UploadFile, File, Request
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import json
#*-----------------------------*
#For Upload PDF feature
#*-----------------------------*
from fastapi import UploadFile, File
import shutil
#*-----------------------------*
#For Download CSV
#*-----------------------------*
import csv
import io
from fastapi.responses import StreamingResponse

load_dotenv()

#*------------------------------*
#For Gemini Api integration
#*------------------------------*
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

POSITIONS = [
    "Production Technician I", "Sr. DBA", "Production Technician II",
    "Software Engineer", "IT Support", "Data Analyst",
    "Database Administrator", "Enterprise Architect", "Sr. Accountant",
    "Production Manager", "Accountant I", "Area Sales Manager",
    "Software Engineering Manager", "BI Director", "Director of Operations",
    "Sr. Network Engineer", "Sales Manager", "BI Developer",
    "IT Manager - Support", "Network Engineer", "IT Director",
    "Director of Sales", "Administrative Assistant", "President & CEO",
    "Senior BI Developer", "Shared Services Manager", "IT Manager - Infra",
    "Principal Data Architect", "Data Architect", "IT Manager - DB", "CIO"
]

DEPARTMENTS = ["Production", "IT/IS", "Software Engineering", "Admin Offices", "Sales"]

hr_system_instruction = f"""
You are a specialized HR Data Extractor. Your task is to extract information from CV text and format it as JSON.
"INSTRUCTION: You are a DATA PARSER, not a writer. 
LOCATE the 'Age' field in the text. 
If the text says 'Age: 45', your JSON MUST contain 45. 
DO NOT ESTIMATE. DO NOT CALCULATE. 
IF DATA IS NOT EXPLICIT, RETURN THE DEFAULT: 30.

STRICT RULES:
2. **Position**: You MUST map the candidate's title to the CLOSEST match from this list: {POSITIONS}.
       - Example: 'DevOps' maps to 'Software Engineer'.
       - Example: 'Lead Infrastructure' maps to 'IT Manager - Infra'.
2. **Department**: Infer the department from the following: {DEPARTMENTS}.
3. **Salary**: Extract the 'Salary' as a raw annual integer. Do NOT divide by 12. If the resume says $115,000, the JSON value must be 115000.
4. **Age**: Extract as an integer. If missing, default to 30.
5. **Sex**: Assign 0 for Male, 1 for Female based on name or pronouns.
6. **JSON Only**: Return ONLY a raw JSON object. Do not include markdown formatting or extra text.
"""

#*------------------------------*

FRONTEND_LINK = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    "http://localhost:5173",
    FRONTEND_LINK
]


async def lifespan(app: FastAPI):
    uri = os.getenv("MONGO_URI")

    # serverSelectionTimeoutMS=2000 prevents Motor from hanging forever if URI is wrong or DB is down
    app.mongodb_client = AsyncIOMotorClient(
        uri,
        serverSelectionTimeoutMS=2000,
        connectTimeoutMS=2000
    )
    app.database = app.mongodb_client.employee_attrition_db

    try:
        await app.mongodb_client.admin.command('ping')
    except Exception as e:
        print(f"❌ MongoDB Connection failed: {e}", flush=True)

    yield

app = FastAPI(title="HR Attrition Predictor API",lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows POST, OPTIONS, GET, etc.
    allow_headers=["*"], # Allows Content-Type, Authorization, etc.
)

#DASHBOARD
#*---------------------*
# STATS for stat cards
'''
*--------------------*
$match, $group are MongoDB Operators
The pipeline is a list w/ stages that happen one after another
1. "$match": {"prediction": {"$regex": "High Risk", "$options": "i"} --> Filters | regex is to identify pattern "High Risk" | i means (case) insensitive 
2. "$group": {"_id": "$Department", "count": {"$sum": 1} --> Categorize & Count
3. "$sort": {"count": -1} --> Sorts by the count. The -1 means descending
4. "$limit": 1 --> Selects the first item (which would have the highest risk)
*--------------------*
'''

@app.get("/api/dashboard-stats")
async def get_stats():
    try:
        total = await app.database["reports"].count_documents({})

        high_risk = await app.database["reports"].count_documents({"prediction": "High Risk"})

        avg_pipeline = [{"$group": {"_id": None, "avg_risk": {"$avg": "$attrition_risk_percent"}}}]
        avg_cursor = app.database["reports"].aggregate(avg_pipeline)
        avg_result = await avg_cursor.to_list(length=1)
        avg_risk_val = avg_result[0]["avg_risk"] if avg_result else 0


        dept_pipeline = [
            {"$match": {"prediction": {"$regex": "High Risk", "$options": "i"}}},
            {"$group": {"_id": "$input_data.Department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]

        #.aggregate() sends the pipeline list to the MongoDB server/reports collection
        #dept_cursor is now a pointer to the data in server, its just a connection NOT data
        dept_cursor = app.database["reports"].aggregate(dept_pipeline)

        #here, cursor fetches data from db and is then converted to list
        dept_result = await dept_cursor.to_list(length=1)
        top_dept = dept_result[0]["_id"] if dept_result else "N/A"

        return {
            "total": total,
            "highRisk": high_risk,
            "avgRisk": f"{round(avg_risk_val)}%",
            "topDept": top_dept
        }
    except Exception as e:
        return {"total": 0, "highRisk": 0, "avgRisk": "0%", "topDept": "N/A"}

#HISTORY TABLE
@app.get("/api/get-history")
async def get_history():
    try:
        # -1 means most recent first
        cursor = app.database["reports"].find().sort("created_at", -1)

        history = await cursor.to_list(length=5)

        for doc in history:
            doc["_id"] = str(doc["_id"])
            # If attrition_risk_percent gets stored as string, forcefully convert to float
            doc["attrition_risk_percent"] = float(doc.get("attrition_risk_percent", 0))

        return history
    except Exception as e:
        print(f"History Fetch Error: {e}")
        return []

#DELETE RECORD
@app.delete("/api/delete-report/{report_id}")
async def delete_report(report_id: str):
    try:
        # Convert the string ID back into a MongoDB ObjectId
        result = await app.database["reports"].delete_one({"_id": ObjectId(report_id)})
        if result.deleted_count == 1:
            return {"message": "Successfully deleted"}
        return {"message": "Report not found"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ID format")


#PREDICTOR
#----------------------------------------------------------------------------------------------------
# Upload PDF / PDF EXTRACTOR
import fitz  # PyMuPDF
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    # Defaults
    final_result = {"Position": "Unknown", "Salary": 5000, "Age": 30, "Department": "Production", "Sex": 0}
    temp_path = f"temp_{file.filename}"

    try:
        # EXTRACTION
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc = fitz.open(temp_path)
        resume_text = "".join([page.get_text() for page in doc])
        doc.close()

        if not resume_text.strip():
            return final_result

        # Check if API Key exists
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return final_result

        # Trigger the call
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            config={"response_mime_type": "application/json", "temperature": 0},
            contents=[hr_system_instruction, f"Resume content: {resume_text}"]
        )

        # RESPONSE VALIDATION
        if not response or not response.text:
            return final_result

        raw_text = response.text.strip()

        ai_data = json.loads(raw_text)

        for key, value in ai_data.items():
            norm_key = key.strip().capitalize()
            if norm_key in final_result:
                final_result[norm_key] = value

    except Exception as e:
        print(f"💥 CRITICAL FAILURE: {type(e).__name__} - {str(e)}")
        # prints the full traceback so we can see the line number
        import traceback
        traceback.print_exc()

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print("=" * 50 + "\n")
        return final_result

#SAVE REPORT
@app.post("/api/save-report")
async def save_report(payload: dict = Body(...)):
    # Safety check: ensures app.database exists
    if not hasattr(app, "database") or app.database is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    try:
        payload["created_at"] = datetime.now(timezone.utc)
        new_report = await app.database["reports"].insert_one(payload)
        return {"id": str(new_report.inserted_id), "status": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save report")


try:
    model = joblib.load('attrition_model.pkl')
    model_columns = joblib.load('model_columns.pkl')

except Exception as e:
    print(f"CRITICAL: Failed to load ML models: {e}", file=sys.stderr)
    sys.exit(1) # stops server

class Employee(BaseModel):
    Salary: float
    Sex: int # 0/1
    EngagementSurvey: float
    EmpSatisfaction: int
    SpecialProjectsCount: int
    DaysLateLast30: int
    Absences: int
    Age: int
    Department: str
    Position: str
    RecruitmentSource: str
    PerformanceScore: str

@app.api_route("/predictor", methods=["POST", "OPTIONS"])
async def predictor(req: Request, emp: Employee | None = None):

    '''
    Handles CORS preflight requests
    Browser sends an OPTIONS request to verify server permissions before the actual POST.
    Browsers have a security policy that prevents a port from making reqs. to diff. ports unless the server explicitly gives permission.
    FastAPI expect an Employee object.
    Since the OPTIONS req. is empty, FastAPI's validation would normally fail & return an error.
    This block of code catches the OPTIONS method and returns empty dictionary {}.
    It sends a 200 OK status back to the browser.
'''
    if req.method == "OPTIONS":
        return {}

    if emp is None:
        raise HTTPException(status_code=400, detail="Missing request body")

    data = emp.model_dump()
    dept = data.pop('Department').strip()
    pos = data.pop('Position').strip()
    rec = data.pop('RecruitmentSource').strip()
    perf = data.pop('PerformanceScore').strip()

    df = pd.DataFrame([data])
    df[f"Department_{dept}"] = 1
    df[f"Position_{pos}"] = 1
    df[f"RecruitmentSource_{rec}"] = 1
    df[f"PerformanceScore_{perf}"] = 1

    # Dataset has a weirdly spaced column name for Department Production
    if dept == "Production":
        df["Department_Production       "] = 1

    df = df.reindex(columns=model_columns, fill_value=0)
    df = df.loc[:, ~df.columns.duplicated()].copy()
    X = df.values.astype(np.float32)

    prob = float(model.predict_proba(X)[0][1])

    return {
        "attrition_risk_percent": round(prob * 100, 2),
        "prediction": "High Risk" if prob > 0.5 else "Low Risk",
        "status": "Success"
    }

#REPORTS
#*----------------------*
@app.get("/api/reports/download-csv")
async def download_csv():
    #  Fetch all documents from reports collection
    cursor = app.database["reports"].find({})
    reports = await cursor.to_list(length=1000)

    # Create the CSV structure in memory
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Date", "Department", "Position", "Salary", "Age",
        "Engagement", "Satisfaction", "Absences", "Risk %", "Status"
    ])

    for r in reports:
        inp = r.get("input_data", {})

        risk = r.get("attrition_risk_percent", 0)
        status = "HIGH RISK" if risk > 50 else "STABLE"

        writer.writerow([
            r.get("timestamp", "N/A"),
            inp.get("Department", "N/A"),
            inp.get("Position", "N/A"),
            inp.get("Salary", 0),
            inp.get("Age", 0),
            inp.get("EngagementSurvey", 0),
            inp.get("EmpSatisfaction", 0),
            inp.get("Absences", 0),
            f"{risk}%",
            status
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attrition_audit_log.csv"}
    )

#ANALYTICS
#*-----------------------*
#DEPARTMENTAL RISK
@app.get("/api/analytics/summary")
async def get_analytics_summary():
    # Department Risk Aggregation
    dept_pipeline = [
        {"$group": {
            "_id": "$input_data.Department",
            "avg_risk": {"$avg": "$attrition_risk_percent"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"avg_risk": -1}}
    ]

    # Risk Distribution Pie Chart
    dist_pipeline = [
        {"$project": {
            "level": {
                "$cond": [
                    {"$gte": ["$attrition_risk_percent", 70]}, "High",
                    {"$cond": [{"$gte": ["$attrition_risk_percent", 30]}, "Medium", "Low"]}
                ]
            }
        }},
        {"$group": {"_id": "$level", "count": {"$sum": 1}}}
    ]

    depts = await app.database["reports"].aggregate(dept_pipeline).to_list(100)
    dist = await app.database["reports"].aggregate(dist_pipeline).to_list(100)

    #Attrition Drivers (or) Feature Importance
    features = [
        {"feature": "Google Search Source", "importance": 0.081},
        {"feature": "Software Engineer Role", "importance": 0.058},
        {"feature": "Diversity Job Fair", "importance": 0.050},
        {"feature": "Production Dept", "importance": 0.049},
        {"feature": "Project Count", "importance": 0.048},
        {"feature": "LinkedIn Source", "importance": 0.042},
        {"feature": "Lateness (Last 30 Days)", "importance": 0.042},
        {"feature": "Indeed Source", "importance": 0.041}
    ]

    return {
        "departments": [{"name": d["_id"], "risk": round(d["avg_risk"], 1), "count": d["count"]} for d in depts],
        "distribution": {d["_id"]: d["count"] for d in dist},
        "features": features
    }
