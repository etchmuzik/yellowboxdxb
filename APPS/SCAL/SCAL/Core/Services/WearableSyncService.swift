import HealthKit

final class WearableSyncService {
    static let shared = WearableSyncService()
    private init() {}
    
    private let healthStore = HKHealthStore()
    
    func requestAuthorization() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else { return false }
        let readTypes: Set = [
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!
        ]
        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
            return true
        } catch {
            return false
        }
    }
    
    func fetchTodayMetrics() async -> (steps: Double, heartRate: Double, sleepHours: Double) {
        let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let heartType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!
        let steps = await querySum(for: stepType)
        let hr = await queryAverageHeartRate(for: heartType)
        let sleep = await querySleepHours(for: sleepType)
        return (steps, hr, sleep)
    }
    
    private func querySum(for type: HKQuantityType) async -> Double {
        let predicate = HKQuery.predicateForSamples(withStart: Calendar.current.startOfDay(for: Date()), end: Date())
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
                let unit: HKUnit = type == HKQuantityType.quantityType(forIdentifier: .stepCount) ? .count() : .count()
                continuation.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            healthStore.execute(query)
        }
    }
    
    private func queryAverageHeartRate(for type: HKQuantityType) async -> Double {
        let predicate = HKQuery.predicateForSamples(withStart: Calendar.current.startOfDay(for: Date()), end: Date())
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .discreteAverage) { _, stats, _ in
                continuation.resume(returning: stats?.averageQuantity()?.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute())) ?? 0)
            }
            healthStore.execute(query)
        }
    }
    
    private func querySleepHours(for type: HKCategoryType) async -> Double {
        let predicate = HKQuery.predicateForSamples(withStart: Calendar.current.date(byAdding: .day, value: -1, to: Date()), end: Date())
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let hours = samples?.compactMap { $0 as? HKCategorySample }.reduce(0) { result, sample in
                    result + sample.endDate.timeIntervalSince(sample.startDate)
                } ?? 0
                continuation.resume(returning: hours / 3600)
            }
            healthStore.execute(query)
        }
    }
}
