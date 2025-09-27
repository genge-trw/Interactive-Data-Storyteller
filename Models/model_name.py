from fastapi import FastAPI, Request
from pydantic import BaseModel
import numpy as np

app = FastAPI()

class ModelTrainingRequest(BaseModel):
    input_data: str

@app.post("/train")
async def train_model(request: ModelTrainingRequest):
    # Training logic here
    return {"status": "model trained successfully"}
