'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type WorkspaceNavProps = {
    role: 'patient' | 'clinician'
}

const patientLinks = [
    { href: '/patient/dashboard', label: 'Overview', icon: '○' },
    { href: '/patient/care', label: 'My care', icon: '♡' },
    { href: '/patient/log', label: 'Health log', icon: '↗' },
    { href: '/patient/medications', label: 'Medications', icon: '+' },
    { href: '/patient/chat', label: 'AI copilot', icon: '✦' },
]

const clinicianLinks = [
    { href: '/clinician/dashboard', label: 'Patient panel', icon: '○' },
    { href: '/clinician/visit', label: 'Record a visit', icon: '+' },
    { href: '/clinician/referrals', label: 'Referrals', icon: '↗' },
    { href: '/clinician/upload', label: 'Clinical files', icon: '□' },
    { href: '/clinician/access', label: 'Access requests', icon: '◇' },
]

export default function WorkspaceNav({ role }: WorkspaceNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const links = role === 'patient' ? patientLinks : clinicianLinks

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <aside className="workspace-nav">
            <Link href="/" className="workspace-brand">
                <span className="brand-mark">M</span>
                <span>
                    <strong>Materna AI</strong>
                    <small>{role === 'patient' ? 'Personal care' : 'Clinical workspace'}</small>
                </span>
            </Link>

            <div className="workspace-nav-section">
                <span className="workspace-nav-label">Workspace</span>
                <nav aria-label={`${role} workspace`}>
                    {links.map((link) => {
                        const active = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href} className={`workspace-link ${active ? 'active' : ''}`}>
                                <span aria-hidden="true">{link.icon}</span>
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="workspace-nav-footer">
                <Link href="/offline-channels" className="workspace-support">
                    <span>⌁</span>
                    <span><strong>Low-connectivity access</strong><small>WhatsApp, SMS & USSD</small></span>
                </Link>
                <button type="button" onClick={signOut} className="workspace-signout">Sign out</button>
            </div>
        </aside>
    )
}