import SeparationTestPanel from "@/components/separation-test-panel"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Question Separation Logic Tests</h1>
          <p className="text-gray-600 mt-1">Test and validate the question separation engine</p>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <SeparationTestPanel />
      </main>
    </div>
  )
}
