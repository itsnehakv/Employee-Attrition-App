import pandas as pd
import numpy as np
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel #Handles the data validation layer, ensuring that incoming JSON requests match the feature schema required by model.
from fastapi.middleware.cors import CORSMiddleware
import joblib
from dotenv import load_dotenv
from fastapi import Body, UploadFile, File
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
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
    uri = os.getenv("MONGO_URI")
    app.mongodb_client = AsyncIOMotorClient(uri)

    app.database = app.mongodb_client.employee_attrition_db

    try:
        # Ping with a timeout
        await app.mongodb_client.admin.command('ping')
        print("✅ MongoDB Connected")
    except Exception as e:
        print(f"❌ MongoDB Timeout: {e}")
        # Setting this to None lets the rest of the app start even if DB is down
        app.database = None

    yield
    app.mongodb_client.close()

app = FastAPI(title="HR Attrition Predictor API",lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Allows any origin
    allow_credentials=True,
    allow_methods=["*"], # Allows POST, OPTIONS, GET, etc.
    allow_headers=["*"], # Allows Content-Type, Authorization, etc.
)

# For the history table
@app.get("/api/get-history")
async def get_history():
    try:
        cursor = app.database["reports"].find().sort("created_at", -1)
        history = await cursor.to_list(length=100)

        for doc in history:
            doc["_id"] = str(doc["_id"])
            if "created_at" not in doc:
                doc["created_at"] = datetime.now(timezone.utc).isoformat()
        return history
    except Exception as e:
        print(f"History Fetch Error: {e}")
        return []

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

@app.get("/api/test-debug")
async def test_debug():
    print("📢 IF YOU SEE THIS, THE TERMINAL IS WORKING!", flush=True)
    return {"status": "alive"}

#----------------------------------------------------------------------------------------------------
# For Upload PDF feature
import fitz  # PyMuPDF

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    print(f"🚀 Received file: {file.filename}")

    # Initialize default data to prevent NameErrors
    extracted_data = {
        "Position": "Unknown",
        "Salary": 5000,
        "Age": 30,
        "Department": "Production",
        "Sex": 0,
    }

    temp_path = f"temp_{file.filename}"
    try:
        # Save temp file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        doc = fitz.open(temp_path)
        resume_text = "".join([page.get_text() for page in doc])
        doc.close()

        # Call Gemini
        # Note: Ensure hr_system_instruction is defined globally with the 31 positions
        response = client.models.generate_content(
            model="gemini-1.5-flash",  # Use the stable model name for your tier
            config={
                "response_mime_type": "application/json",
            },
            contents=[hr_system_instruction, f"Resume content: {resume_text}"]
        )

        # Robust Parsing Logic
        raw_json_text = response.text.strip()
        # Clean markdown if Gemini wrapped it in ```json
        if "```" in raw_json_text:
            raw_json_text = raw_json_text.split("```")[1].replace("json", "").strip()

        extracted_data = json.loads(raw_json_text)
        print(f"✅ Parsed Data: {extracted_data}")

    except Exception as e:
        print(f"❌ Extraction Error: {e}")
        # extracted_data remains as the default initialized above

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return extracted_data

#SAVE REPORT
@app.post("/api/save-report")
async def save_report(payload: dict = Body(...)):
    payload["created_at"] = datetime.now(timezone.utc)
    new_report = await app.database["reports"].insert_one(payload)
    return {"id": str(new_report.inserted_id), "status": "Success"}

try:
    model = joblib.load('attrition_model.pkl')
    model_columns = joblib.load('model_columns.pkl')
    print("✅ Backend Ready: Model and Columns Loaded")
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

@app.post("/predictor")
async def predict(emp: Employee):
    print("--- NEW PREDICTION REQUEST ---")
    try:
        data = emp.model_dump() # Turns the input into a dictionary

        #Handling str data
        dept = str(data.pop('Department', '')).strip()
        pos = str(data.pop('Position', '')).strip()
        rec = str(data.pop('RecruitmentSource', '')).strip()
        perf = str(data.pop('PerformanceScore', '')).strip()

        df = pd.DataFrame([data]) #Puts the remaining data values that are numbers into a table

        df[f"Department_{dept}"] = 1
        df[f"Position_{pos}"] = 1
        df[f"RecruitmentSource_{rec}"] = 1
        df[f"PerformanceScore_{perf}"] = 1

        #Reindex looks at model_columns, adds all the missing columns (like Position_CEO), and fills them with 0.
        #Also, puts it in order that XGBoost requires.
        df = df.reindex(columns=model_columns, fill_value=0)

        #Remove any accidentally duplicated columns
        df = df.loc[:, ~df.columns.duplicated()].copy()

        X = df.values.astype(np.float32)

        # What is the probability this per  son leaves (Class 1)
        # The model returns a 2D list: [[prob_stay, prob_leave]]
        # [0] accesses the first row (a single employee)--> [prob_stay, prob_leave] -> Removes the nested array
        # [1] accesses the second value (the probability of leaving) [prob_leave]
        prob_matrix = model.predict_proba(X)
        prob = float(prob_matrix[0][1])


        return {
            "attrition_risk_percent": round(float(prob) * 100, 2),
            "prediction": "High Risk" if prob > 0.5 else "Low Risk",
            "status": "Success"
        }

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
