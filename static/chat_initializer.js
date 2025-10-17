document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing chat functionality...');
    
    const chatButton = document.getElementById('chatButton');
    const chatBox = document.querySelector('.chatbox');
    
    if (chatButton && chatBox) {
        chatButton.addEventListener('click', function() {
            console.log('Chat button clicked');
            chatBox.classList.toggle('chatbox--active');
        });
    } else {
        console.error('Chat elements not found:', {
            button: !!chatButton,
            box: !!chatBox
        });
    }
});