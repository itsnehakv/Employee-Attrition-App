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
from contextlib import asynccontextmanager
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import json
#*-----------------------------*
#For Upload PDF feature
#*-----------------------------*
from fastapi import UploadFile, File
import shutil

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

async def lifespan(app: FastAPI):
    print("🚀 DEBUG: Entering Lifespan...", flush=True)
    uri = os.getenv("MONGO_URI")

    # serverSelectionTimeoutMS=2000 is CRITICAL.
    # Without it, Motor hangs forever if the URI is wrong or DB is down.
    app.mongodb_client = AsyncIOMotorClient(
        uri,
        serverSelectionTimeoutMS=2000,
        connectTimeoutMS=2000
    )
    app.database = app.mongodb_client.employee_attrition_db

    try:
        print(f"🔗 DEBUG: Pinging MongoDB at {uri}...", flush=True)
        # We wrap this in a wait to see if it's the specific line that hangs
        await app.mongodb_client.admin.command('ping')
        print("✅ DEBUG: MongoDB Connected Successfully", flush=True)
    except Exception as e:
        print(f"❌ DEBUG: MongoDB Connection failed: {e}", flush=True)
        print("⚠️ DEBUG: Proceeding without DB to prevent Preflight hang...", flush=True)

    yield
    print("🛑 DEBUG: Shutting down...", flush=True)

app = FastAPI(title="HR Attrition Predictor API",lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows any origin
    allow_credentials=True,
    allow_methods=["*"], # Allows POST, OPTIONS, GET, etc.
    allow_headers=["*"], # Allows Content-Type, Authorization, etc.
)

# For the history table
@app.get("/api/get-history")
async def get_history():
    cursor = app.database["reports"].find().sort("created_at", -1)
    history = await cursor.to_list(length=100)
    for doc in history:
        doc["_id"] = str(doc["_id"]) # Convert MongoDB ID to string
    return history

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

#----------------------------------------------------------------------------------------------------
# For Upload PDF feature
import fitz  # PyMuPDF
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    print("\n" + "=" * 50)
    print(f"🔍 STEP 1: Request received for {file.filename}")

    # Defaults
    final_result = {"Position": "Unknown", "Salary": 5000, "Age": 30, "Department": "Production", "Sex": 0}
    temp_path = f"temp_{file.filename}"

    try:
        # --- PDF EXTRACTION ---
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc = fitz.open(temp_path)
        resume_text = "".join([page.get_text() for page in doc])
        doc.close()

        if not resume_text.strip():
            print("❌ ERROR: PDF text extraction resulted in an empty string!")
            return final_result

        print(f"✅ STEP 2: Text Extracted ({len(resume_text)} chars)")

        # --- GEMINI API CHECK ---
        print("📡 STEP 3: Attempting to contact Gemini API...")

        # Check if API Key exists
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ ERROR: GEMINI_API_KEY is missing from .env!")
            return final_result

        # Trigger the call
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            config={"response_mime_type": "application/json", "temperature": 0},
            contents=[hr_system_instruction, f"Resume content: {resume_text}"]
        )

        # --- RESPONSE VALIDATION ---
        if not response or not response.text:
            print("❌ ERROR: Gemini returned an empty response.")
            return final_result

        raw_text = response.text.strip()
        print(f"📥 STEP 4: Gemini Replied: {raw_text}")

        ai_data = json.loads(raw_text)

        for key, value in ai_data.items():
            norm_key = key.strip().capitalize()
            if norm_key in final_result:
                final_result[norm_key] = value
                print(f"📌 Mapped: {norm_key} -> {value}")

        print("🎯 STEP 5: Successfully processed all data.")

    except Exception as e:
        print(f"💥 CRITICAL FAILURE: {type(e).__name__} - {str(e)}")
        # This will print the full traceback so we can see the line number
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
        print("❌ DB Error: Database object not found on app")
        raise HTTPException(status_code=503, detail="Database not initialized")

    try:
        payload["created_at"] = datetime.now(timezone.utc)
        new_report = await app.database["reports"].insert_one(payload)
        return {"id": str(new_report.inserted_id), "status": "Success"}
    except Exception as e:
        print(f"❌ DB Save Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save report")


# DASHBOARD STATS
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
        print(f"❌ Stats Error: {e}")
        return {"total": 0, "highRisk": 0, "avgRisk": "0%", "topDept": "N/A"}

try:
    model = joblib.load('attrition_model.pkl')
    model_columns = joblib.load('model_columns.pkl')

except Exception as e:
    print(f"❌ Backend Critical Error: {e}")

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

    # 👇 Handle preflight instantly (NO validation error)
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

    if dept == "Production":
        # Dataset has a weirdly spaced column name for Department Production
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
