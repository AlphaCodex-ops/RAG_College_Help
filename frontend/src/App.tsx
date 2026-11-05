import { useEffect, useRef, useState, type FormEvent } from 'react'
import { answerQuestion, campusFaq } from './lib/localFaq'
import './App.css'

type Message = {
  id: number
  role: 'assistant' | 'user'
  text: string
  source?: string
  suggestions?: string[]
}

const starterQuestions = campusFaq.slice(0, 4)

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [showQuestions, setShowQuestions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(1)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  function ask(questionText: string) {
    const text = questionText.trim()
    if (!text) return

    const result = answerQuestion(text)
    const nextId = nextMessageId.current
    nextMessageId.current += 2
    setMessages((current) => [
      ...current,
      { id: nextId, role: 'user', text },
      {
        id: nextId + 1,
        role: 'assistant',
        text: result.answer,
        source: result.source,
        suggestions: result.suggestions,
      },
    ])
    setQuestion('')
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask(question)
  }

  function startOver() {
    setMessages([])
    setQuestion('')
  }

  return (
    <main className="app-shell">
      <section className="chat-window" aria-label="CHAAMP campus assistant">
        <header className="chat-header">
          <div className="brand">
            <div className="brand-avatar" aria-hidden="true">C</div>
            <div>
              <h1>CHAAMP</h1>
              <p>Campus assistant</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="mode-indicator"><span aria-hidden="true" /> Local FAQ</span>
            <button className="text-button" type="button" onClick={startOver} disabled={!messages.length}>
              New chat
            </button>
          </div>
        </header>

        <div className="question-browser">
          <button
            className="browse-button"
            type="button"
            aria-expanded={showQuestions}
            aria-controls="preset-questions"
            onClick={() => setShowQuestions((shown) => !shown)}
          >
            {showQuestions ? 'Hide' : 'Browse'} the {campusFaq.length} preset questions
            <span aria-hidden="true">{showQuestions ? '−' : '+'}</span>
          </button>
          {showQuestions && (
            <div className="preset-list" id="preset-questions">
              {campusFaq.map((item) => (
                <button
                  className="preset-question"
                  key={item.id}
                  type="button"
                  onClick={() => ask(item.question)}
                >
                  <span>{item.question}</span>
                  <small>{item.category}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="conversation" aria-live="polite">
          {!messages.length ? (
            <div className="welcome">
              <div className="welcome-icon" aria-hidden="true">C</div>
              <h2>Hi! What can I help you with?</h2>
              <p>Ask a campus question or choose one of these to get started.</p>
              <div className="starter-questions">
                {starterQuestions.map((item) => (
                  <button key={item.id} type="button" onClick={() => ask(item.question)}>
                    {item.question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message-row ${message.role}`} key={message.id}>
                  {message.role === 'assistant' && (
                    <div className="message-avatar" aria-hidden="true">C</div>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">{message.text}</div>
                    {message.source && <div className="message-source">Source: {message.source}</div>}
                    {message.suggestions && (
                      <div className="related-questions" aria-label="Suggested questions">
                        {message.suggestions.map((suggestion) => (
                          <button key={suggestion} type="button" onClick={() => ask(suggestion)}>
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="chat-footer">
          <p className="demo-notice">
            Local demo answers only. They are sample guidance, not verified or official campus policies.
          </p>
          <form className="composer" onSubmit={submitQuestion}>
            <label className="sr-only" htmlFor="question-input">Your question</label>
            <input
              id="question-input"
              autoComplete="off"
              placeholder="Ask a campus question..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button type="submit" disabled={!question.trim()} aria-label="Send question">
              Send <span aria-hidden="true">↑</span>
            </button>
          </form>
        </footer>
      </section>
    </main>
  )
}

export default App
