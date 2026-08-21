import WorkspaceNav from '@/components/WorkspaceNav'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    return <div className="workspace-layout"><WorkspaceNav role="patient" /><div className="workspace-content">{children}</div></div>
}