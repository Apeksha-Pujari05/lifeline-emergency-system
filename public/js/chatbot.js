/* =============================================
   LIFELINE — chatbot.js
   Interactive support helper logic
============================================= */

const chatbotHTML = `
<div class="chatbot-container">
    <div class="chatbot-window" id="chatbotWindow">
        <div class="chatbot-header">
            <h3>Lifeline Support</h3>
            <p>Assistant • Online</p>
        </div>
        <div class="chatbot-messages" id="chatMsgs">
            <div class="chat-msg bot">Hi! I'm here to help you with anything related to Lifeline. How can I assist you today?</div>
        </div>
        <div class="chatbot-options" id="chatOptions">
            <div class="chat-option" onclick="handleChatOption('Cancel SOS')">Cancel SOS</div>
            <div class="chat-option" onclick="handleChatOption('Help Centre')">Help Centre</div>
            <div class="chat-option" onclick="handleChatOption('Report Abuse')">Report Abuse</div>
            <div class="chat-option" onclick="handleChatOption('Talk to Agent')">Talk to Agent</div>
        </div>
    </div>
    <div class="chatbot-fab" onclick="toggleChatbot()">
        <span id="chatIcon">💬</span>
    </div>
</div>
`;

function injectChatbot() {
    const div = document.createElement('div');
    div.innerHTML = chatbotHTML;
    document.body.appendChild(div);
}

function toggleChatbot() {
    const win = document.getElementById('chatbotWindow');
    const icon = document.getElementById('chatIcon');
    win.classList.toggle('open');
    icon.textContent = win.classList.contains('open') ? '✕' : '💬';
}

function handleChatOption(option) {
    appendMessage(option, 'user');
    
    setTimeout(() => {
        let response = "";
        switch(option) {
            case 'Cancel SOS':
                response = "To cancel an SOS, please go to your Dashboard, find the active incident in the 'Recent SOS' list, and contact the assigned responder or click the cancel button if available. Note: Frequent cancellations after response may lead to warnings.";
                break;
            case 'Help Centre':
                response = "Our Help Centre is available 24/7. You can learn about how to set up emergency contacts, enable high-accuracy GPS, and understand our legal terms regarding fake alerts.";
                break;
            case 'Report Abuse':
                response = "Lifeline takes abuse seriously. If you encounter fake SOS alerts or misuse by others, report it here. Our team will investigate immediately using Aadhaar verification data.";
                break;
            case 'Talk to Agent':
                response = "Transferring you to a live emergency coordinator... (Simulation: In real use, this would initiate a VoIP call).";
                break;
            default:
                response = "I'm not sure how to help with that. Please select one of the options below.";
        }
        appendMessage(response, 'bot');
    }, 600);
}

function appendMessage(text, type) {
    const container = document.getElementById('chatMsgs');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${type}`;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

document.addEventListener('DOMContentLoaded', injectChatbot);
