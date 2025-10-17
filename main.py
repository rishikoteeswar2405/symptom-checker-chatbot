from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from chat import get_response

app = Flask(__name__)
CORS(app)

@app.get("/")
def index_get():
    return render_template("base.html")

@app.route('/login')
def login():
    return render_template("login.html")

@app.route('/admin')
def admin():
    return render_template("admin.html")

@app.route('/about')
def about_us():
    return render_template("about_us.html")


@app.post("/predict")
def predict():
    text = request.get_json().get("message")
    #TODO : check if text is valid
    response = get_response(text)
    message = {"answer" : response}
    return jsonify(message)

@app.post("/process_symptoms")
def process_symptoms():
    data = request.get_json()
    
    # Extract user data
    name = data.get('name')
    age = data.get('age')
    gender = data.get('gender')
    symptoms = data.get('symptoms', [])
    additional_info = data.get('additionalInfo')
    
    # Process symptoms through the existing model
    symptom_text = ", ".join([s['name'] for s in symptoms])
    severity_info = ", ".join([f"Severity: {s['severity']}/10" for s in symptoms])
    
    # Get response from the existing chat model
    response = get_response(symptom_text)
    
    # Enhance the response with severity information
    if isinstance(response, list):
        response.append(severity_info)
    else:
        response = [response, severity_info]
    
    return jsonify({
        "status": "success",
        "response": response,
        "user_info": {
            "name": name,
            "age": age,
            "gender": gender
        }
    })

if __name__ == "__main__":
    app.run(debug=True)

