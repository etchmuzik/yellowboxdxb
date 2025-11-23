import SwiftUI

struct WearableMetricsView: View {
    @State private var metrics: (steps: Double, heartRate: Double, sleep: Double) = (0, 0, 0)
    @State private var hasPermission = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Wearable Sync")
                .font(.headline)
            HStack {
                metricCard(title: "Steps", value: Int(metrics.steps))
                metricCard(title: "HR", value: Int(metrics.heartRate))
                metricCard(title: "Sleep", value: Int(metrics.sleep))
            }
            Button(hasPermission ? "Refresh" : "Connect") {
                Task { await refresh() }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .task { await refresh() }
    }
    
    private func metricCard(title: String, value: Int) -> some View {
        VStack {
            Text(title)
            Text("\(value)")
                .font(.system(size: 32, weight: .bold))
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
    
    private func refresh() async {
        if !hasPermission {
            hasPermission = await WearableSyncService.shared.requestAuthorization()
        }
        let newMetrics = await WearableSyncService.shared.fetchTodayMetrics()
        metrics = (newMetrics.steps, newMetrics.heartRate, newMetrics.sleepHours)
    }
}
