import Link from 'next/link'

const problems = [
    ['01', 'Care disappears between visits', 'Paper folders and siloed systems leave clinicians blind to what happens after a patient leaves the hospital.'],
    ['02', 'Warning signs arrive too late', 'A changing blood pressure, missed medicine, or new symptom can wait months for the next appointment.'],
    ['03', 'Access is not equal', 'Pregnant women, chronic patients, and families outside major cities need care that works with limited data.'],
]

const advantages = [
    ['Shared clinical record', 'The visit a nurse records becomes the context for the patient, the care team, and the AI.'],
    ['Explainable risk tiers', 'Green, Amber, and Red flags show what is driving risk, so teams can act with confidence.'],
    ['Human escalation', 'The copilot explains and routes. It never diagnoses, prescribes, or replaces a clinician.'],
    ['Built for Nigeria', 'Patient app, provider portal, CHW workflows, and WhatsApp/SMS/USSD access in one network.'],
]

export default function LandingPage() {
    return (
        <main className="marketing-page">
            <header className="marketing-header">
                <Link href="/" className="marketing-brand"><span className="brand-mark">M</span><span><strong>Materna AI</strong><small>Continuity of care</small></span></Link>
                <nav className="marketing-nav" aria-label="Main navigation"><a href="#why">Why Materna</a><a href="#how">How it works</a><a href="#advantage">Our edge</a></nav>
                <div className="marketing-actions"><Link href="/login" className="button button-quiet">Sign in</Link><Link href="/login" className="button button-dark">Get started <span>↗</span></Link></div>
            </header>

            <section className="hero-section">
                <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> Care that continues</p><h1>Better care does not stop at the hospital door.</h1><p className="hero-lede">Materna AI connects the people, records, and decisions that keep maternal and chronic care moving forward, from the clinic to everyday life.</p><div className="hero-actions"><Link href="/login" className="button button-dark button-large">Start your care journey <span>↗</span></Link><Link href="/login" className="text-link">I work in a clinic <span>→</span></Link></div><div className="trust-row"><span>Designed for Nigeria</span><span>•</span><span>Human-led AI</span><span>•</span><span>NDPR-minded by design</span></div></div>
                <div className="hero-visual" aria-label="Materna AI continuity of care overview"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="care-preview"><div className="preview-top"><span className="preview-kicker">TODAY · 08:42</span><span className="status-chip">● On track</span></div><h2>Good morning, Amaka</h2><p>Your care team has reviewed your latest check-in.</p><div className="preview-line"><span className="line-icon">↗</span><span><strong>Next appointment</strong><small>Thursday, 22 August · 10:00</small></span><span className="line-arrow">→</span></div><div className="preview-line"><span className="line-icon coral">+</span><span><strong>Medication reminder</strong><small>Ferrous sulfate · due in 2 hours</small></span><span className="line-arrow">→</span></div><div className="preview-footer"><span className="avatar-stack"><i>IF</i><i>DB</i></span><span>Care team connected</span><span className="pulse" /></div></div><div className="floating-note note-risk"><span className="note-icon">✦</span><span><strong>Risk reviewed</strong><small>Factors explained to your team</small></span></div><div className="floating-note note-loop"><span className="loop-number">3</span><span><strong>Surfaces, one record</strong><small>Patient · provider · AI</small></span></div></div>
            </section>

            <section id="why" className="problem-section"><div className="section-intro"><p className="eyebrow">The gap we close</p><h2>Health is lived between appointments.</h2><p>The hardest part of care is often the time nobody sees. Materna AI gives that time a signal, a record, and a response.</p></div><div className="problem-grid">{problems.map(([number, title, text]) => <article key={number} className="problem-item"><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

            <section id="how" className="loop-section"><div className="section-intro"><p className="eyebrow">One connected loop</p><h2>From clinical insight to everyday action.</h2></div><div className="loop-grid"><div className="loop-step"><span className="step-number">01</span><div><h3>Provider portal</h3><p>Nurses and clinicians capture structured vitals, labs, notes, and prescriptions faster than paper.</p></div></div><div className="loop-connector">→</div><div className="loop-step"><span className="step-number">02</span><div><h3>Intelligent layer</h3><p>Explainable risk tiers and a record-grounded copilot surface the next best action.</p></div></div><div className="loop-connector">→</div><div className="loop-step"><span className="step-number">03</span><div><h3>Patient companion</h3><p>People see their care in plain language, log symptoms, order medicine, and reach a human.</p></div></div></div></section>

            <section id="advantage" className="advantage-section"><div className="section-intro"><p className="eyebrow">Why Materna AI</p><h2>Not another health app. The connective tissue.</h2><p>Most solutions own one slice of the journey. Materna AI is designed around the handoff between them.</p></div><div className="advantage-grid">{advantages.map(([title, text], index) => <article key={title} className="advantage-item"><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

            <section className="audience-section"><div><p className="eyebrow">Built around real people</p><h2>One platform, different ways to belong.</h2></div><div className="audience-links"><Link href="/login"><span>For patients</span><small>Understand your record and stay on track →</small></Link><Link href="/login"><span>For clinicians</span><small>See the patients who need you sooner →</small></Link><Link href="/offline-channels"><span>For communities</span><small>Reach care through the channels you have →</small></Link></div></section>

            <footer className="marketing-footer"><Link href="/" className="marketing-brand"><span className="brand-mark">M</span><span><strong>Materna AI</strong><small>Continuity of care</small></span></Link><span>Maternal and chronic care, connected.</span><span>© 2026 Materna AI</span></footer>
        </main>
    )
}
