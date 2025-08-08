import ProcessingScenariosDemo from "@/components/processing-scenarios-demo"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Question Card System Demo</h1>
          <p className="text-gray-600 mt-1">Test different processing scenarios and card interactions</p>
        </div>
      </header>
      
      <main className="py-8">
        <ProcessingScenariosDemo />
      </main>
    </div>
  )
}
