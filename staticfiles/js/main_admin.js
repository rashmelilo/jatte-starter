/**
 * variables
 */
const chatRoom = document.querySelector("#room_uuid").textContent.replaceAll('"', '')
let chatSocket = null


/**
 * Elements
 */
const chatLogElement = document.querySelector("#chat_log");
const chatInputElement = document.querySelector("#chat_message_input");
const chatSubmitElement = document.querySelector("#chat_message_submit");

/**
 * functions
 */
function sendMessage() {
    chatSocket.send(
      JSON.stringify({
        type: "chat_message",
        message: chatInputElement.value,
        name: document.querySelector("#user_name").textContent.replaceAll('"', ''),
        agent: document.querySelector("#user_id").textContent.replaceAll('"', ''),
      })
    );
    chatInputElement.value = "";
  }

function onChatMessage(data) {
    console.log("onChatMessage", data);
    if (data.type === "chat_message") {
      console.log("Processing chat message...");
      if (!data.agent) {
        // If the message is not from an agent, append it to the chat log
        chatLogElement.innerHTML += `
             <div class="flex">
             <span class="inline-block rounded-full bg-gray-300 text-white w-8 h-8 flex items-center justify-center ml-2">${data.initials}</span>
             <div class="bg-blue-300 p-3 rounded-l-lg rounded-br-lg">
             <p class="text-sm">${data.message}</p>
             </div>
                  </div>
                  <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span><br>
             `;
        console.log(
          "Message from user:",
          data.message,
          "user initials:",
          data.initials
        );
      } else {
        // If the message is from an agent, append it with additional details
        const { message, name, initials } = data;
        chatLogElement.innerHTML += `
              <div class="flex">
              <span class="inline-block rounded-full bg-gray-300 text-white w-8 h-8 flex items-center justify-center ml-2">${data.initials}</span>
              <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
              <p class="text-sm">${data.message}</p>
              </div>
                 </div>
                 <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span><br>
              `;
        console.log("Message from agent:", message);
      }
    }
  }

/**
 * Web Socket
 */
chatSocket = new WebSocket(
  `ws://${window.location.host}/ws/${chatRoom}/`  
)
chatSocket.onmessage = function(e){
    console.log('on message')
    onChatMessage(JSON.parse(e.data))
}

chatSocket.onopen = function(e){
    console.log('on open')
}
chatSocket.onclose = function(e){
    console.log('chat socket closed unexpectedly')
}
/**
 * Event listeners
 */
chatSubmitElement.onclick = function (e) {
    e.preventDefault()
    sendMessage()
  }
  
chatInputElement.onkeyup = function (e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      sendMessage();
    }
}

chatInputElement.onfocus = function (e) {
  chatSocket.send(JSON.stirngify)({
    type: "update",
    message: "writing_active",
    name: document.querySelector("#user_name").textContent.replaceAll('"', ''),
    agent: document.querySelector("#user_id").textContent.replaceAll('"', ''),



    
  })
}