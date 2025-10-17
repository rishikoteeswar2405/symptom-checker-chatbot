class Chatbox {
    constructor() {
        this.args = {
            openButton: document.getElementById('chatButton'),
            chatBox: document.querySelector('.chatbox'),
            sendButton: document.querySelector('.send__button'),
            closeButton: document.querySelector('.chatbox__close--header'),
            voiceButton: document.querySelector('#voiceInputBtn'),
            attachButton: document.querySelector('#attachFileBtn'),
            emojiButton: document.querySelector('#emojiBtn'),
            exportButton: document.querySelector('#exportChatBtn'),
            scrollBottomButton: document.querySelector('#scrollToBottomBtn')
        };

        this.state = false;
        this.messages = [];
        this.wizardMode = false;
    // Add wizard trigger phrases (initialize early so other methods can use it)
    this.wizardTriggers = ['start checkup', 'begin diagnosis', 'check symptoms', 'new consultation'];
        this.isSending = false; // Flag to prevent duplicate sends
        
        // Initialize emergency contacts
        this.emergencyContacts = JSON.parse(localStorage.getItem('emergencyContacts')) || [];
        this.setupEmergencyButton();
        this.setupHistoryButton();
        
        // Initialize theme
        this.initializeTheme();
    }

    display() {
        const {openButton, chatBox, sendButton, closeButton, voiceButton, attachButton, emojiButton, exportButton, scrollBottomButton} = this.args;

        // Verify required elements exist
        const inputField = chatBox.querySelector('.chatbox__footer input');
        if (!inputField) {
            console.warn('Input field not found!');
            return;
        }

        // Message handling
        if (sendButton) {
            console.log('Setting up send button');
            sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.onSendButton(chatBox);
            });
        }

        // Input field handlers
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed');
                e.preventDefault();
                this.onSendButton(chatBox);
            }
        });

        // Auto focus on chat open
        chatBox.addEventListener('transitionend', () => {
            if (this.state) inputField.focus();
        });

        // Chat box controls
        openButton.addEventListener('click', () => this.toggleState(chatBox));
        closeButton.addEventListener('click', () => this.toggleState(chatBox));

        // Feature buttons
        if (voiceButton) voiceButton.addEventListener('click', () => this.startVoiceInput());
        if (attachButton) attachButton.addEventListener('click', () => this.handleFileAttachment());
        if (emojiButton) emojiButton.addEventListener('click', () => this.toggleEmojiPicker());
        if (exportButton) exportButton.addEventListener('click', () => this.exportChatHistory());
        if (scrollBottomButton) scrollBottomButton.addEventListener('click', () => this.scrollToBottom());

        // Scroll button visibility
        const messagesContainer = chatBox.querySelector('.chatbox__messages');
        if (messagesContainer && scrollBottomButton) {
            messagesContainer.addEventListener('scroll', () => {
                scrollBottomButton.style.display = 
                    messagesContainer.scrollTop + messagesContainer.clientHeight < messagesContainer.scrollHeight - 50 
                    ? 'block' : 'none';
            });
        }

        // Emergency button
        const emergencyBtn = document.querySelector('#emergencyBtn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => this.showEmergencyModal());
        }
    }

    toggleState(chatbox) {
        this.state = !this.state;

        // show or hides the box
        if(this.state) {
            chatbox.classList.add('chatbox--active')
        } else {
            chatbox.classList.remove('chatbox--active')
        }
    }

    onSendButton(chatbox) {
        console.log('onSendButton called');
        
        // Get input field and button
        const textField = chatbox.querySelector('.chatbox__footer input[type="text"]');
        const sendButton = chatbox.querySelector('.send__button');

        if (!textField || !sendButton) {
            console.error('Required elements not found!');
            return;
        }
        
        let text1 = textField.value.trim();
        console.log('Input value:', text1);
        
        // Prevent empty messages and duplicate sends
        if (text1 === "" || this.isSending) {
            console.log('Send prevented - empty:', text1 === "", 'sending:', this.isSending);
            return;
        }

        // Check for wizard trigger phrases
        if (this.wizardTriggers.some(trigger => text1.toLowerCase().includes(trigger))) {
            const wizardEl = document.querySelector('.chatbox__wizard');
            const messagesEl = document.querySelector('.chatbox__messages');
            
            if (wizardEl && messagesEl) {
                wizardEl.style.display = 'block';
                messagesEl.style.display = 'none';
                textField.value = '';
                return;
            }
        }

        // Add user message
        this.messages.push({ name: "User", message: text1 });
        this.updateChatText(chatbox);

        // Prevent duplicate sends and disable input
        this.isSending = true;
        textField.disabled = true;
        sendButton.disabled = true;

        // Send request
        console.log('Sending to /predict');
        fetch('/predict', {
            method: 'POST',
            body: JSON.stringify({ message: text1}),
            mode: 'cors',
            headers: {
               'Content-Type': 'application/json'
            },
        })
        .then(r => r.json())
        .then(r => {
            console.log('Got response:', r);
            // Add bot message
            this.messages.push({
                name: "Sam", 
                message1: r.answer[0],
                message2: r.answer[1], 
                message3: r.answer[2],
                message4: r.answer[3]
            });
            this.updateChatText(chatbox);
            textField.value = '';
        })
        .catch((error) => {
            console.error('Error:', error);
            // Add error message
            this.messages.push({
                name: "Sam",
                message1: "error",
                message2: "Sorry, I encountered an error. Please try again.",
                message3: "",
                message4: ""
            });
            this.updateChatText(chatbox);
        })
        .finally(() => {
            // Reset UI state
            textField.disabled = false;
            sendButton.disabled = false;
            this.isSending = false;
            textField.value = '';
            textField.focus();
        });
    }

    initializeTheme() {
        // Check saved theme preference
        const darkMode = localStorage.getItem('darkMode') === 'enabled';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    setupEmergencyButton() {
        const emergencyBtn = document.querySelector('#emergencyBtn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => this.showEmergencyModal());
        }
    }

    setupHistoryButton() {
        const historyBtn = document.querySelector('#historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistoryModal());
        }
    }

    showEmergencyModal() {
        Swal.fire({
            title: 'Emergency Contacts',
            html: `
                <div class="emergency-contacts">
                    ${this.getEmergencyContactsHTML()}
                </div>
                <button class="btn btn-success mt-3" onclick="chatbox.addEmergencyContact()">
                    Add New Contact
                </button>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                container: document.body.classList.contains('dark-mode') ? 'dark-mode' : ''
            }
        });
    }

    addEmergencyContact() {
        Swal.fire({
            title: 'Add Emergency Contact',
            html: `
                <input id="contactName" class="swal2-input" placeholder="Contact Name">
                <input id="contactPhone" class="swal2-input" placeholder="Phone Number">
                <input id="contactRelation" class="swal2-input" placeholder="Relationship">
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            confirmButtonColor: '#4CAF50',
            preConfirm: () => {
                return {
                    name: document.getElementById('contactName').value,
                    phone: document.getElementById('contactPhone').value,
                    relation: document.getElementById('contactRelation').value
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const contact = result.value;
                this.emergencyContacts.push(contact);
                localStorage.setItem('emergencyContacts', JSON.stringify(this.emergencyContacts));
                this.showEmergencyModal();
            }
        });
    }

    getEmergencyContactsHTML() {
        if (this.emergencyContacts.length === 0) {
            return '<p>No emergency contacts added yet.</p>';
        }
        return this.emergencyContacts.map((contact, index) => `
            <div class="emergency-contact-card">
                <h4>${contact.name}</h4>
                <p>${contact.phone}</p>
                <p class="text-muted">${contact.relation}</p>
                <button class="btn btn-danger btn-sm" onclick="chatbox.deleteEmergencyContact(${index})">
                    Delete
                </button>
            </div>
        `).join('');
    }

    deleteEmergencyContact(index) {
        this.emergencyContacts.splice(index, 1);
        localStorage.setItem('emergencyContacts', JSON.stringify(this.emergencyContacts));
        this.showEmergencyModal();
    }

    showHistoryModal() {
        const history = JSON.parse(localStorage.getItem('symptomHistory') || '[]');
        Swal.fire({
            title: 'Consultation History',
            html: this.getHistoryHTML(history),
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                container: document.body.classList.contains('dark-mode') ? 'dark-mode' : ''
            }
        });
    }

    getHistoryHTML(history) {
        if (history.length === 0) {
            return '<p>No consultation history available.</p>';
        }
        return history.map(entry => `
            <div class="history-card">
                <div class="history-date">
                    ${moment(entry.timestamp).format('MMMM D, YYYY h:mm A')}
                </div>
                <div class="history-details">
                    <p><strong>Symptoms:</strong> ${entry.symptoms.map(s => s.name).join(', ')}</p>
                    <p><strong>Severity:</strong> ${entry.symptoms.map(s => s.severity).join(', ')}</p>
                    ${entry.additionalInfo ? `<p><strong>Notes:</strong> ${entry.additionalInfo}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    showNearbyLocations() {
        // Send a message to request locations
        let text1 = "yes show me locations";
        let msg1 = { name: "User", message: text1 };
        this.messages.push(msg1);

        // Send the location request
        fetch('/predict', {
            method: 'POST',
            body: JSON.stringify({ message: text1 }),
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(r => r.json())
        .then(r => {
            let msg2 = { name: "Sam", message1: "center", message2: r.answer[1], message3: r.answer[2], message4: r.answer[3] };
            this.messages.push(msg2);
            this.updateChatText(this.args.chatBox);
        })
        .catch((error) => {
            console.error('Error:', error);
            this.updateChatText(this.args.chatBox);
        });
    }

    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        const recordingIndicator = document.querySelector('.voice-recording-indicator');
        recordingIndicator.classList.add('active');

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            this.args.chatBox.querySelector('.chatbox__footer input').value = text;
        };

        recognition.onend = () => {
            recordingIndicator.classList.remove('active');
        };

        recognition.start();
    }

    handleFileAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '200px';
                    img.style.maxHeight = '200px';
                    
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'messages__item messages__item--operator';
                    messageDiv.appendChild(img);
                    
                    this.args.chatBox.querySelector('.messages__wrapper').appendChild(messageDiv);
                    this.scrollToBottom();
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    toggleEmojiPicker() {
        // You can implement emoji picker library of your choice
        alert('Emoji picker coming soon!');
    }

    exportChatHistory() {
        const messages = this.messages.map(msg => {
            if (msg.name === "User") {
                return `User: ${msg.message}\n`;
            } else {
                return `Bot: ${msg.message1 || ''} ${msg.message2 || ''} ${msg.message3 || ''}\n`;
            }
        }).join('');

        const blob = new Blob([messages], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    scrollToBottom() {
        const messagesContainer = this.args.chatBox.querySelector('.chatbox__messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateChatText(chatbox) {
        var html = '<div class="messages__wrapper">';
        // Add initial greeting at the top if messages array is empty
        if (this.messages.length === 0) {
            html += '<div class="messages__item messages__item--visitor">Hi, this is a medical chat support.</div>' +
                   '<div class="messages__item messages__item--visitor">May I know your name.</div>';
        }
        
        const specificTags = ["greeting", "goodbye","work","who","Thanks","joke", "name", "age", "gender", "not_understand"]
        this.messages.forEach(function(item, index) {
            if (item.name === "Sam")
            {
                /*html +=  '<div class="myDIV">' + item.message3 + item.prob3 + '</div>' 
                    + '<div class="hide">' + item.message31 +'</div>'
                    + '<div class="myDIV">' + item.message2 + item.prob2 + '</div>'
                    + '<div class="hide">' + item.message21 + '</div>'
                    + '<div class="myDIV">' + item.message1 + item.prob1 + '</div>'
                    + '<div class="hide">' + item.message11 + '</div>'
                    + '<div class="con" style="margin-top:20px; margin-bottom:10px"><h3>These may be the possible diseases that you may have.</h3></div>'
                */
                if (specificTags.includes(item.message1)){
                    html += '<div class="messages__item messages__item--visitor">' + item.message2 + '</div>'
                }
                else if (item.message1 === "center"){ 
                    html += '<div class="messages__item messages__item--visitor">You can ask me if you want any thing else.</div>'
                            + '<div class="myDIV" style="font-size: 17px;">' + item.message4[0] + ', ' + item.message4[1] + '</div>'
                            + '<div class="hide">' + item.message4[2] + '</div>'
                            + '<div class="myDIV" style="font-size: 17px;">' + item.message3[0] + ', ' + item.message3[1] + '</div>'
                            + '<div class="hide">' + item.message3[2] + '</div>'
                            + '<div class="myDIV" style="font-size: 17px;">' + item.message2[0] + ', ' + item.message2[1] + '</div>'
                            + '<div class="hide">' + item.message2[2] + '</div>'
                            + '<div class="con" style="margin-top:20px; margin-bottom:10px"><h3>Medical location that are near to you are.</h3></div>'
                }
                else {
                    // 1. First show the possible disease
                    html += '<div class="con" style="margin-top:20px; margin-bottom:10px"><h3>This may be the possible disease that you may have.</h3></div>'
                            + '<div class="myDIV">' + item.message1 + '</div>'
                            
                    // 2. Then show more info about the disease with precautions and description
                            + '<div class="messages__item messages__item--visitor">Here is some more info on the disease</div>'
                            + '<div class="accordion" id="accordionExample">'
                                + '<div class="accordion-item" style="width: 40%; margin-top: 10px" >'
                                + '<h2 class="accordion-header" id="headingOne">'
                                + '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">'
                                + '<b>Precautions</b>'
                                + '</button>'
                                + '</h2>'
                                + '<div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">'
                                + '<div class="accordion-body">'
                                + item.message3
                                + '</div>'
                                + '</div>'
                                + '</div>'
                                + '</div>'
                            + '<div class="accordion" id="accordionExample-2">'
                                    + '<div class="accordion-item" style="width: 40%; margin-top: 10px" >'
                                    + '<h2 class="accordion-header" id="headingThree">'
                                    + '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">'
                                    + '<b>Description</b>'
                                    + '</button>'
                                    + '</h2>'
                                    + '<div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample-2">'
                                    + '<div class="accordion-body">'
                                    + item.message2
                                    + '</div>'
                                    + '</div>'
                                    + '</div>'
                                    + '</div>'
                                    
                    // 3. Finally ask about nearby locations with a clickable button
                            + '<div class="messages__item messages__item--visitor" style="margin-top:20px">'
                            + 'Do you want to know about the nearby medical center locations? '
                            + '<button onclick="chatbox.showNearbyLocations()" class="btn btn-primary btn-sm">Show Locations</button>'
                            + '</div>'   
                }
            }
            else
            {
                // User messages should be right-aligned
                html += `
                    <div class="messages__item messages__item--operator">
                        ${item.message}
                        <div class="message-timestamp">${moment().format('h:mm A')}</div>
                        <div class="message-actions">
                            <button class="message-action-button" onclick="navigator.clipboard.writeText('${item.message}')">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="message-action-button" onclick="chatbox.reactToMessage(this)">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>`
            }
        });
        
        html += '</div>'; // Close messages wrapper
        const chatmessage = chatbox.querySelector('.chatbox__messages');
        chatmessage.innerHTML = html;
    }
    
}


document.addEventListener('DOMContentLoaded', () => {
    const chatbox = new Chatbox();
    chatbox.display();
    window.chatbox = chatbox; // Make chatbox accessible globally for the wizard
});
