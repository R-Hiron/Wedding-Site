import { Link } from 'react-router-dom'
import { faq, visibility } from '../content'
import './Faq.css'

export function Faq() {
  return (
    <div className="faq page-inner page-inner--wide">
      <h1 className="faq__title script">Frequently Asked Questions</h1>
      <div className="faq__sections">
        {faq.map((section) => (
          <section key={section.title} className="faq__section">
            <h2 className="faq__section-title serif-caps">{section.title}</h2>
            <dl className="faq__list">
              {section.items.map((item) => (
                <div key={item.question} className="faq__item">
                  <dt className="faq__question">{item.question}</dt>
                  <dd className="faq__answer">
                    {item.answer.includes('RSVP') && visibility.showRsvp ? (
                      <>
                        {item.answer.split('RSVP').map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 ? (
                              <Link to="/rsvp">RSVP</Link>
                            ) : null}
                          </span>
                        ))}
                      </>
                    ) : (
                      item.answer
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}
