# RETAIN.AI | Employee Attrition Predictor

<div align="center"><a href="https://employee-attrition-app-tawny.vercel.app" alt="RetainAI Live Dashboard"><img src="https://img.shields.io/badge/Retain.AI_Live_Dashboard_↗-darkblue?style=for-the-badge" /></a>

  <br />
  <br />
  <br />
  
<p align="center">
    <kbd><b>PLATFORM WALKTHROUGH</b></kbd>
  </p>
  
  <img src="AttritionDemo.gif" width="900" alt="RetainAI Demo" />
</div>

## *Strategic AI for Talent Retention & Cost Optimization*
###  Business Impact
Employee turnover is a multi-billion dollar problem. This project provides HR teams with an **Intelligence Report** that predicts "Flight Risk" with **~70% accuracy**, allowing for proactive intervention. By automating the data extraction from resumes and predicting attrition, this tool directly aims to **reduce turnover costs** and improve organizational stability.
<br>
<br>
<br> 
<div align="center">
<h4>• Core Implementation •</h4>
  
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-05998b?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/) •
[![React](https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/) • 
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)•[![XGBoost](https://img.shields.io/badge/ML-XGBoost-ebbd2d?style=for-the-badge)](https://xgboost.readthedocs.io/) •
[![Google Gemini](https://img.shields.io/badge/AI-Gemini_Pro-4285F4?style=for-the-badge&logo=googlegemini)](https://deepmind.google/technologies/gemini/)
</div>

<div align="center">
<h5>• Languages •</h5>

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) 
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) 
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) 
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)

</div>

## Dataset
 ➤ <a href="https://www.kaggle.com/datasets/rhuebner/human-resources-data-set" alt="Link to Dataset"> Human Resources Data Set</a> by  Dr. Carla Patalano and Dr. Rich Huebner

##  Key Features
- **GenAI Resume Parsing:** Uses **Google Gemini Pro** to extract complex employee metrics from uploaded PDFs, bypassing manual data entry.
- **Predictive Risk Modeling:** Implements a cost-sensitive **XGBoost** classifier to identify high-risk employees.
- **Dynamic HR Dashboard:** A sleek, dark-themed UI featuring **Risk Gauges**, **Intelligence Reports**, and **AI-generated Strategy Recommendations**.
- **Automated Intelligence Reports:** Generates full-scale PDF/CSV detailed reports, enabling HR leads to transition from raw data to board-ready presentations instantly.
- **Enterprise-Ready Data Flow:** Secure handling of employee records using **MongoDB Atlas**, ensuring data persistence and historical trend tracking (MDE).

---

## Tech Stack 
| Category | Technology | Implementation |
| :--- | :--- | :--- |
| **Frontend** | **React (Vite), Tailwind** | Responsive SPA with a dark-themed HR workspace. |
| **Frontend** | **Fetch API** | Utilizing native browser APIs for asynchronous data fetching and promise-based HTTP requests. |
| **Backend** | **FastAPI** | Building a high-performance, asynchronous REST API with automatic OpenAPI documentation. |
| **Backend** | **Pydantic** | Enforcing strict data validation and type-safe schemas for incoming employee data. |
| **Parsing** | **PyMuPDF (fitz)** | Low-level PDF binary stream extraction before GenAI processing. |
| **Security** | **CORS Middleware** | Orchestrated Cross-Origin Resource Sharing for secure Vercel-to-Render communication. |
| **Database** | **Motor (Async MongoDB)** | Non-blocking database drivers to ensure high-concurrency performance. |
| **AI Engine** | **Google Gemini Pro** | Leveraging Large Language Models (LLMs) for intelligent data extraction from PDF resumes. |
| **ML Model** | **XGBoost** | Deploying Gradient Boosted Decision Trees with cost-sensitive weights for risk classification. |
| **Deployment** | **Vercel, Render** | Distributed cloud hosting with automated CI/CD. |

##  System Architecture
1. **Data Acquisition (Dual Entry):**
   - **Automated Path:** User uploads a CV via **React**; **FastAPI** orchestrates the file stream to **Google Gemini Pro** for entity extraction.
   - **Manual Path:** Users can directly input employee metrics into a structured form, bypassing the AI extraction for immediate results.
2. **Standardization & Validation:** Both data paths converge at the **Pydantic** layer, which enforces strict schema validation and type-safety before the data reaches the ML model.
3. **Intelligence Layer (Inference):** The validated data is processed by a pre-trained **XGBoost** model.
4. **Cloud Persistence:** Prediction logs and metadata are asynchronously committed to **MongoDB Atlas** using the **Motor** driver.
5. **Real-Time Analytics:** The dashboard leverages **MongoDB Aggregation Pipelines** (`$match`, `$group`, `$avg`) to offload heavy computations to the database. This enables real-time tracking of **Risk Hotspots** (high-risk departments) and **Organizational Averages**. Data is fetched via the native **Fetch API** for instant UI synchronization.
## Challenges Faced During Development

### 1. Gemini API Rate-Limit Management 
**The Problem:** During the integration of Google Gemini, the system frequently hit API rate limits despite low usage volume, and the frontend-to-backend data stream was failing to trigger the extraction logic correctly.
- **The Pivot:** - **Model Switching:** Swapped models to optimize token usage and cost-efficiency.
- **Robust Debugging:** Implemented a comprehensive logging and "Safety Mechanism" layer to catch rate-limit exceptions before they crashed the frontend.

### 2. Prioritizing Business Impact (From SMOTE to Cost-Sensitivity)
**The Problem:** Initial attempts to handle dataset imbalance using **SMOTE** (Synthetic Minority Over-sampling Technique) resulted in lower Precision and Recall, as the synthetic data introduced noise that hindered the model's ability to generalize to real employee behavior.
- **The Pivot:** I pivoted to **Cost-Sensitive Learning** by tuning the `scale_pos_weight` parameter & I abandoned the resampled `X_train_res` dataset in favor of the original, authentic **`X_train`**. This forced the model to learn from real-world distributions while penalizing the misclassification of flight risks, significantly improving the model's predictive reliability.

<div align="center">
  
| Metric | Old Model (SMOTE) | New Model (Weighted XGBoost) | Impact |
| :--- | :--- | :--- | :--- |
| **Overall Accuracy** | 67.00% | **69.84%** | `+2.84%` Improvement |
| **Precision (Class 1)** | 53.00% | **60.00%** | Higher reliability in flags |
| **Recall (Class 1)** | 41.00% | 41.00% | Consistent detection rate |
| **Class 0 Recall** | 80.00% | **85.00%** | `5%` fewer False Positives |
| **Data Integrity** | Synthetic | **Organic (Original)** | No "hallucinated" data |
</div>

## Local Development Setup
#### Backend (FastAPI)
1. Navigate to `/backend` and create a `.env` file with your `GEMINI_API_KEY` and `MONGO_URI`.
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `uvicorn main:app --reload`

#### Frontend (React)
1. Navigate to `/frontend` and install dependencies: `npm install`
2. Start the development server: `npm run dev`

## References

[SMOTE](https://www.geeksforgeeks.org/machine-learning/ml-handling-imbalanced-data-with-smote-and-near-miss-algorithm-in-python) • [No module error](https://www.geeksforgeeks.org/python/how-to-fix-no-module-named-xgboost-in-python) • [Deprecated dict in Pydantic](https://github.com/fastapi/fastapi/discussions/11912) • [Gemini API quickstart](https://ai.google.dev/gemini-api/docs/quickstart#python) • [MongoDB Atlas pipeline stages](https://www.mongodb.com/docs/manual/reference/mql/aggregation-stages)

---
<div align="center">
  
Made by **Neha K Vallappil** •
[LinkedIn](https://www.linkedin.com/in/nehakvallappil)
</div>
