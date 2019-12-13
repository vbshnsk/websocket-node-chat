const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://'

const wsChat = new WebSocket(protocol + location.hostname + ':' + location.port + '/chat')

const parseData = data => {
    const parsedData = JSON.parse(data)

    const element = document.createElement('div')

    const username = document.createElement('h3')
    username.innerHTML = parsedData.username ? parsedData.username : 'Guest'
    username.setAttribute('class', 'username')
    element.appendChild(username)
    
    const message = document.createElement('p')
    message.innerHTML = parsedData.message
    message.setAttribute('class', 'message')
    element.appendChild(message)
    
    const date = document.createElement('p')
    date.innerHTML = new Date(parsedData.date).toLocaleString('en-GB')
    date.setAttribute('class', 'date')
    element.appendChild(date)
    
    const elementClass = 'message-container ' + (parsedData.current ? 'sent' : 'recieved')
    element.setAttribute('class', elementClass)

    return element
} 

document.getElementById('send').onclick = () => {
    const message = document.getElementById('message').value
    document.getElementById('message').value = ''
    wsChat.send(message)
} 

wsChat.onmessage = event => {
    const message = parseData(event.data)
    document.getElementById('chat').appendChild(message)
    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight
}

wsChat.onclose = event => {
    console.log(event)
}

[...document.getElementsByClassName('date')].forEach(element => element.innerHTML = new Date(element.innerHTML).toLocaleString('en-GB'))

document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight