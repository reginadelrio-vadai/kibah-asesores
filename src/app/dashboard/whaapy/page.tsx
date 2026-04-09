import { MessageSquare } from 'lucide-react'

export default function WhaapyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mb-6">
        <MessageSquare className="w-10 h-10 text-text-tertiary" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-semibold text-text-primary mb-2">Whaapy</h1>
      <p className="text-text-secondary max-w-sm">
        Proximamente: gestiona tus conversaciones de WhatsApp aqui
      </p>
    </div>
  )
}
