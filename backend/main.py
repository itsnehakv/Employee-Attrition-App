import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel #Handles the data validation layer, ensuring that incoming JSON requests match the feature schema required by model.
from typing import List

app = FastAPI(title="HR Attrition Predictor API")

model = joblib.load('attrition_model.pkl')
model_columns = joblib.load('model_columns.pkl')

class Employee(BaseModel):
    Salary: int
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

@app.post("/predict")
def predict(emp: Employee):
    data = emp.model_dump() # Turns the input into a dictionary

    #Handling str data
    dept = data.pop('Department') # Pulls Department names like sales/hr out to handle it separately
    pos = data.pop('Position')
    rec = data.pop('RecruitmentSource')
    perf = data.pop('PerformanceScore')

    df = pd.DataFrame([data]) #Puts the remaining data values that are numbers into a table

    df[f"Department_{dept.strip()}"] = 1 #Creates the 'Department_Sales' column and sets it to 1
    df[f"Position_{pos.strip()}"] = 1
    df[f"RecruitmentSource_{rec.strip()}"] = 1
    df[f"PerformanceScore_{perf.strip()}"] = 1


    #Reindex looks at model_columns, adds all the missing columns (like Position_CEO), and fills them with 0.
    #Also, puts it in order that XGBoost requires.
    df = df.reindex(columns=model_columns, fill_value=0)

    # What is the probability this person leaves (Class 1)
    # The model returns a 2D list: [[prob_stay, prob_leave]]
    # [0] accesses the first row (a single employee)--> [prob_stay, prob_leave] -> Removes the nested array
    # [1] accesses the second value (the probability of leaving) [prob_leave]
    prob = model.predict_proba(df)[0][1]

    return {
        "attrition_risk_percent": round(float(prob) * 100, 2),
        "prediction": "High Risk" if prob > 0.5 else "Low Risk",
        "status": "Success"
    }