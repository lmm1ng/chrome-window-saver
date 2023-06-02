function getAllSessions() {
    return chrome.storage.sync.get(["sessions"]).then(res => {
        return res.sessions ? JSON.parse(res.sessions) : []
    })
}

function getSessionById(id) {
    return getAllSessions().then(sessions => sessions.find(el => el.id === id))
}

function writeSessions(sessions) {
    return chrome.storage.sync.set({sessions: JSON.stringify(sessions)})
}

function deleteSession(id) {
    return getAllSessions().then(sessions => writeSessions(sessions.filter(el => el.id !== id)))
}

function addSession(session) {
    return getAllSessions().then(sessions => writeSessions([...sessions, session]))
}

function updateSession(id, urls) {
    return getAllSessions().then(sessions => {
        const updatedList = sessions.map(el => {
            if (el.id === id) {
                return {...el, urls}
            }
            return el
        })

        return writeSessions(updatedList)
    })
}

function generateId() {
    return Math.random().toString(16).slice(2)
}

function getCurrentUrls() {
    return chrome.tabs.query({currentWindow: true})
        .then(res => res.map(el => el.url))
}

function saveCurrentSession(name) {
    return getCurrentUrls().then(urls => addSession({id: generateId(), name, urls})).catch(alert)
}

function createSessionRow(session) {
    const wrapper = document.createElement('div')
    wrapper.classList.add('session')
    wrapper.setAttribute('data-id', session.id)

    const li = document.createElement('li')
    li.textContent = session.name
    wrapper.appendChild(li)

    const buttons = document.createElement('div')
    buttons.classList.add('buttons')

    const deleteButton = document.createElement('img')
    deleteButton.setAttribute('data-action', 'delete')
    deleteButton.src = './icons/delete.png'
    deleteButton.classList.add('icon-button')
    deleteButton.width = 20
    deleteButton.height = 20
    buttons.appendChild(deleteButton)

    const updateButton = document.createElement('img')
    updateButton.setAttribute('data-action', 'update')
    updateButton.src = './icons/update.png'
    updateButton.classList.add('icon-button')
    updateButton.width = 20
    updateButton.height = 20
    buttons.appendChild(updateButton)

    wrapper.appendChild(buttons)

    return wrapper
}

function updateSessionRows() {
    const sessionsWrapper = document.querySelector('.saved-sessions')
    sessionsWrapper.innerHTML = ''
    getAllSessions().then(res => {
        res.forEach(session => {
            sessionsWrapper.appendChild(createSessionRow(session))
        })
    })
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#save-button')
        .addEventListener('click', () => {
            const input = document.querySelector('#session-name')
            if (!input.value) {
                return alert('Please enter session name')
            }
            saveCurrentSession(input.value).then(() => updateSessionRows()).then(() => input.value = '')
        })

    document.querySelector('.saved-sessions')
        .addEventListener('click', e => {
            const sessionId = e.target.closest('.session').getAttribute('data-id')

            if (e.target.tagName === 'LI') {
                getSessionById(sessionId).then(session => chrome.windows.create({url: session.urls}))
            }

            if (e.target.tagName === 'IMG') {
                const action = e.target.getAttribute('data-action')

                if (action === 'delete') {
                    if (window.confirm('Do you really want to delete session?')) {
                        deleteSession(sessionId).then(() => updateSessionRows())
                    }
                }
                if (action === 'update') {
                    if (window.confirm('Do you really want to update session?')) {
                        getCurrentUrls().then(urls => {
                            updateSession(sessionId, urls)
                        })
                    }
                }
            }
        })

    updateSessionRows()
})
