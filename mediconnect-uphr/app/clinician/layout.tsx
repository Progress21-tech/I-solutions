import WorkspaceNav from '@/components/WorkspaceNav'

export default function ClinicianLayout({ children }: { children: React.ReactNode }) {
    return <div className="workspace-layout"><WorkspaceNav role="clinician" /><div className="workspace-content">{children}</div></div>
}