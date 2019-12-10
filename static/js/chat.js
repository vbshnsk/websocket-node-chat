const ws = new WebSocket('wss://' + location.hostname + ':' + location.port + '/chat')

const parseData = data => {
    const parsedData = JSON.parse(data)

    const element = document.createElement('div')

    const username = document.createElement('h3')
    username.innerHTML = parsedData.username
    element.appendChild(username)

    const message = document.createElement('p')
    message.innerHTML = parsedData.message
    element.appendChild(message)

    const date = document.createElement('p')
    date.innerHTML = new Date(parsedData.date).toLocaleString('en-GB')
    element.appendChild(date)

    element.setAttribute('id', 'message-container')

    return element
} 

document.getElementById('send').onclick = () => {
    const message = document.getElementById('message').value
    ws.send(message)
} 

ws.onmessage = event => {
    const message = parseData(event.data)
    document.getElementById('chat').appendChild(message)
}