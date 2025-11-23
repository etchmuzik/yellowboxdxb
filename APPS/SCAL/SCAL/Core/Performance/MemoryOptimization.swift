//
//  MemoryOptimization.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Memory-efficient data structures and utilities
//

import SwiftUI
import Combine
import CoreData

// MARK: - Lightweight Data Models

/// Memory-efficient meal representation for lists
struct LightweightMeal: Identifiable, Equatable {
    let id: UUID
    let name: String
    let calories: Int
    let timestamp: Date
    
    init(from meal: SimpleMeal) {
        self.id = meal.id
        self.name = meal.name
        self.calories = meal.calories
        self.timestamp = meal.timestamp
    }
}

/// Compressed nutrition data for charts
struct CompressedNutritionData: Identifiable {
    let id = UUID()
    let date: Date
    let values: [Float] // [calories, protein, carbs, fat, water]
    
    var calories: Int { Int(values[0]) }
    var protein: Double { Double(values[1]) }
    var carbs: Double { Double(values[2]) }
    var fat: Double { Double(values[3]) }
    var water: Double { Double(values[4]) }
    
    init(from data: DailyNutritionData) {
        self.date = data.date
        self.values = [
            Float(data.calories),
            Float(data.protein),
            Float(data.carbs),
            Float(data.fat),
            Float(data.waterIntake)
        ]
    }
}

// MARK: - Memory Pool

class MemoryPool<T> {
    private var pool: [T] = []
    private let maxSize: Int
    private let factory: () -> T
    private let reset: (T) -> Void
    
    init(maxSize: Int = 50, factory: @escaping () -> T, reset: @escaping (T) -> Void) {
        self.maxSize = maxSize
        self.factory = factory
        self.reset = reset
    }
    
    func acquire() -> T {
        if pool.isEmpty {
            return factory()
        } else {
            return pool.removeLast()
        }
    }
    
    func release(_ object: T) {
        if pool.count < maxSize {
            reset(object)
            pool.append(object)
        }
    }
}

// MARK: - Weak Reference Container

class WeakRef<T: AnyObject> {
    weak var value: T?
    
    init(_ value: T) {
        self.value = value
    }
}

class WeakArray<T: AnyObject> {
    private var items: [WeakRef<T>] = []
    
    func append(_ object: T) {
        clean()
        items.append(WeakRef(object))
    }
    
    func remove(_ object: T) {
        items.removeAll { $0.value === object }
    }
    
    var allObjects: [T] {
        clean()
        return items.compactMap { $0.value }
    }
    
    private func clean() {
        items.removeAll { $0.value == nil }
    }
}

// MARK: - Lazy Data Loader

@MainActor
class LazyDataLoader<T> {
    private var cache: [String: T] = [:]
    private var loadingTasks: [String: Task<T, Error>] = [:]
    private let loader: (String) async throws -> T
    
    init(loader: @escaping (String) async throws -> T) {
        self.loader = loader
    }
    
    func load(_ key: String) async throws -> T {
        // Return cached value if available
        if let cached = cache[key] {
            return cached
        }
        
        // Return existing loading task if in progress
        if let existingTask = loadingTasks[key] {
            return try await existingTask.value
        }
        
        // Create new loading task
        let task = Task {
            let value = try await loader(key)
            cache[key] = value
            loadingTasks.removeValue(forKey: key)
            return value
        }
        
        loadingTasks[key] = task
        return try await task.value
    }
    
    func invalidate(_ key: String) {
        cache.removeValue(forKey: key)
        loadingTasks[key]?.cancel()
        loadingTasks.removeValue(forKey: key)
    }
    
    func invalidateAll() {
        cache.removeAll()
        loadingTasks.values.forEach { $0.cancel() }
        loadingTasks.removeAll()
    }
}

// MARK: - Paged Data Source

class PagedDataSource<T: Identifiable> {
    private var pages: [Int: [T]] = [:]
    private let pageSize: Int
    private let loader: (Int, Int) async throws -> [T]
    
    init(pageSize: Int = 20, loader: @escaping (Int, Int) async throws -> [T]) {
        self.pageSize = pageSize
        self.loader = loader
    }
    
    func loadPage(_ pageIndex: Int) async throws -> [T] {
        if let cachedPage = pages[pageIndex] {
            return cachedPage
        }
        
        let offset = pageIndex * pageSize
        let items = try await loader(offset, pageSize)
        pages[pageIndex] = items
        
        // Keep only nearby pages in memory
        cleanupDistantPages(currentPage: pageIndex)
        
        return items
    }
    
    private func cleanupDistantPages(currentPage: Int) {
        let keepRange = (currentPage - 2)...(currentPage + 2)
        pages = pages.filter { keepRange.contains($0.key) }
    }
    
    func invalidate() {
        pages.removeAll()
    }
}

// MARK: - Compressed Image Storage

class CompressedImageStore {
    private let compressionQuality: CGFloat
    private let maxDimension: CGFloat
    
    init(compressionQuality: CGFloat = 0.7, maxDimension: CGFloat = 1024) {
        self.compressionQuality = compressionQuality
        self.maxDimension = maxDimension
    }
    
    func compress(_ image: UIImage) -> Data? {
        let resized = resizeImage(image, maxDimension: maxDimension)
        return resized.jpegData(compressionQuality: compressionQuality)
    }
    
    func decompress(_ data: Data) -> UIImage? {
        UIImage(data: data)
    }
    
    private func resizeImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let aspectRatio = size.width / size.height
        
        var newSize: CGSize
        if size.width > size.height {
            newSize = CGSize(width: maxDimension, height: maxDimension / aspectRatio)
        } else {
            newSize = CGSize(width: maxDimension * aspectRatio, height: maxDimension)
        }
        
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return resizedImage ?? image
    }
}

// MARK: - Memory-Aware Cache

class MemoryAwareCache<Key: Hashable, Value> {
    private var cache: [Key: Value] = [:]
    private var costs: [Key: Int] = [:]
    private var totalCost = 0
    private let maxCost: Int
    private let queue = DispatchQueue(label: "com.scal.cache", attributes: .concurrent)
    
    init(maxCost: Int = 50 * 1024 * 1024) { // 50MB default
        self.maxCost = maxCost
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
    }
    
    func set(_ value: Value, for key: Key, cost: Int) {
        queue.async(flags: .barrier) {
            // Remove old value if exists
            if let oldCost = self.costs[key] {
                self.totalCost -= oldCost
            }
            
            // Evict items if needed
            while self.totalCost + cost > self.maxCost && !self.cache.isEmpty {
                self.evictOldest()
            }
            
            // Add new value
            self.cache[key] = value
            self.costs[key] = cost
            self.totalCost += cost
        }
    }
    
    func get(_ key: Key) -> Value? {
        queue.sync {
            cache[key]
        }
    }
    
    private func evictOldest() {
        // Simple eviction - remove first item
        if let firstKey = cache.keys.first {
            if let cost = costs[firstKey] {
                totalCost -= cost
            }
            cache.removeValue(forKey: firstKey)
            costs.removeValue(forKey: firstKey)
        }
    }
    
    @objc private func handleMemoryWarning() {
        queue.async(flags: .barrier) {
            self.cache.removeAll()
            self.costs.removeAll()
            self.totalCost = 0
        }
    }
}

// MARK: - Efficient Data Aggregator

class DataAggregator {
    private let queue = DispatchQueue(label: "com.scal.aggregator", attributes: .concurrent)
    private var pendingData: [String: [Any]] = [:]
    private var timers: [String: Timer] = [:]
    
    func aggregate<T>(_ data: T, for key: String, delay: TimeInterval = 0.5, completion: @escaping ([T]) -> Void) {
        queue.async(flags: .barrier) {
            // Add data to pending
            if self.pendingData[key] == nil {
                self.pendingData[key] = []
            }
            self.pendingData[key]?.append(data)
            
            // Cancel existing timer
            self.timers[key]?.invalidate()
            
            // Create new timer
            let timer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { _ in
                self.flush(key: key, completion: completion)
            }
            self.timers[key] = timer
        }
    }
    
    private func flush<T>(key: String, completion: @escaping ([T]) -> Void) {
        queue.async(flags: .barrier) {
            guard let data = self.pendingData[key] as? [T] else { return }
            
            self.pendingData.removeValue(forKey: key)
            self.timers[key]?.invalidate()
            self.timers.removeValue(forKey: key)
            
            DispatchQueue.main.async {
                completion(data)
            }
        }
    }
}

// MARK: - Core Data Batch Fetcher

extension NSManagedObjectContext {
    func batchFetch<T: NSManagedObject>(
        _ type: T.Type,
        predicate: NSPredicate? = nil,
        sortDescriptors: [NSSortDescriptor] = [],
        batchSize: Int = 20,
        offset: Int = 0
    ) throws -> [T] {
        let request = NSFetchRequest<T>(entityName: String(describing: type))
        request.predicate = predicate
        request.sortDescriptors = sortDescriptors
        request.fetchBatchSize = batchSize
        request.fetchOffset = offset
        request.fetchLimit = batchSize
        
        // Use property description to fetch only needed properties
        request.propertiesToFetch = T.lightweightProperties
        
        return try fetch(request)
    }
}

extension NSManagedObject {
    static var lightweightProperties: [String] {
        // Override in subclasses to specify minimal properties
        return []
    }
}

// MARK: - Memory Monitoring

class MemoryMonitor {
    static let shared = MemoryMonitor()
    
    private let threshold: Float = 0.8 // 80% memory usage threshold
    private var observers: WeakArray<AnyObject> = WeakArray()
    
    var memoryUsageRatio: Float {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }
        
        if result == KERN_SUCCESS {
            let usedMemory = Float(info.resident_size)
            let totalMemory = Float(ProcessInfo.processInfo.physicalMemory)
            return usedMemory / totalMemory
        }
        
        return 0
    }
    
    var isMemoryPressureHigh: Bool {
        memoryUsageRatio > threshold
    }
    
    func startMonitoring() {
        Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            if self.isMemoryPressureHigh {
                NotificationCenter.default.post(
                    name: .memoryPressureHigh,
                    object: nil
                )
            }
        }
    }
}

extension Notification.Name {
    static let memoryPressureHigh = Notification.Name("memoryPressureHigh")
}