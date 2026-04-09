import { Key } from 'lucide-react'

export default function ApiKeysPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Key className="w-12 h-12 text-text-tertiary mb-4" strokeWidth={1.5} />
      <h1 className="text-xl font-semibold text-text-primary mb-2">API Keys</h1>
      <p className="text-text-secondary">Coming in M6</p>
    </div>
  )
}
