class SymptomWizard {
    constructor() {
        this.currentStep = 1;
        this.userData = {
            name: '',
            age: '',
            gender: '',
            symptoms: [],
            additionalInfo: ''
        };
        this.initializeListeners();
    }

    initializeListeners() {
        const nextBtn = document.querySelector('.wizard-next');
        const prevBtn = document.querySelector('.wizard-prev');
        const severitySlider = document.querySelector('#severitySlider');
        const severityValue = document.querySelector('#severityValue');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
        if (severitySlider) {
            severitySlider.addEventListener('input', (e) => {
                severityValue.textContent = e.target.value;
            });
        }
    }

    showStep(step) {
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
        document.querySelector(`[data-step="${step}"]`).style.display = 'block';
        
        const prevBtn = document.querySelector('.wizard-prev');
        const nextBtn = document.querySelector('.wizard-next');
        
        if (step === 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
        }

        if (step === 3) {
            nextBtn.textContent = 'Submit';
        } else {
            nextBtn.textContent = 'Next';
        }
    }

    validateStep(step) {
        switch(step) {
            case 1:
                const name = document.querySelector('#userName').value;
                const age = document.querySelector('#userAge').value;
                const gender = document.querySelector('#userGender').value;
                return name && age && gender;
            case 2:
                const symptom = document.querySelector('#symptomInput').value;
                return symptom;
            case 3:
                return true;
            default:
                return false;
        }
    }

    collectStepData(step) {
        switch(step) {
            case 1:
                this.userData.name = document.querySelector('#userName').value;
                this.userData.age = document.querySelector('#userAge').value;
                this.userData.gender = document.querySelector('#userGender').value;
                break;
            case 2:
                this.userData.symptoms.push({
                    name: document.querySelector('#symptomInput').value,
                    severity: document.querySelector('#severitySlider').value
                });
                break;
            case 3:
                this.userData.additionalInfo = document.querySelector('#additionalInfo').value;
                break;
        }
    }

    nextStep() {
        if (!this.validateStep(this.currentStep)) {
            Swal.fire({
                title: 'Please fill all required fields',
                icon: 'warning',
                confirmButtonColor: '#4CAF50'
            });
            return;
        }

        this.collectStepData(this.currentStep);

        if (this.currentStep === 3) {
            this.submitData();
            return;
        }

        this.currentStep++;
        this.showStep(this.currentStep);
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    submitData() {
        // Show loading state
        document.querySelector('.chatbox__typing').style.display = 'block';
        document.querySelector('.chatbox__wizard').style.display = 'none';

        // Save to local storage for history
        this.saveToHistory();

        // Send to backend
        fetch('/process_symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.userData)
        })
        .then(response => response.json())
        .then(data => {
            document.querySelector('.chatbox__typing').style.display = 'none';
            this.displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.querySelector('.chatbox__typing').style.display = 'none';
            Swal.fire({
                title: 'Error',
                text: 'Something went wrong. Please try again.',
                icon: 'error',
                confirmButtonColor: '#4CAF50'
            });
        });
    }

    saveToHistory() {
        const history = JSON.parse(localStorage.getItem('symptomHistory') || '[]');
        history.unshift({
            ...this.userData,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('symptomHistory', JSON.stringify(history));
        this.updateHistoryNotification();
    }

    updateHistoryNotification() {
        const historyBtn = document.querySelector('#historyBtn');
        if (historyBtn) {
            historyBtn.classList.add('has-notifications');
        }
    }

    displayResults(data) {
        // Implementation will be added in the main app.js
    }
}

// Initialize the wizard when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.symptomWizard = new SymptomWizard();
});