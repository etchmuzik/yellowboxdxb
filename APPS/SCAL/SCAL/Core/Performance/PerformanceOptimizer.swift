//
//  PerformanceOptimizer.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Performance optimization utilities for 120fps ProMotion displays
//

import SwiftUI
import UIKit
import Combine
import os.log

// MARK: - Performance Monitor

@MainActor
class PerformanceMonitor: ObservableObject {
    static let shared = PerformanceMonitor()
    
    @Published var currentFPS: Double = 0
    @Published var averageFPS: Double = 0
    @Published var memoryUsage: Double = 0
    @Published var cpuUsage: Double = 0
    
    private var displayLink: CADisplayLink?
    private var lastTimestamp: CFTimeInterval = 0
    private var frameCount = 0
    private var fpsHistory: [Double] = []
    private let maxHistorySize = 60
    
    private let logger = Logger(subsystem: "com.scal.performance", category: "monitor")
    
    init() {
        startMonitoring()
    }
    
    func startMonitoring() {
        displayLink = CADisplayLink(target: self, selector: #selector(updateMetrics))
        displayLink?.add(to: .main, forMode: .default)
    }
    
    func stopMonitoring() {
        displayLink?.invalidate()
        displayLink = nil
    }
    
    @objc private func updateMetrics(displayLink: CADisplayLink) {
        if lastTimestamp == 0 {
            lastTimestamp = displayLink.timestamp
            return
        }
        
        frameCount += 1
        let elapsed = displayLink.timestamp - lastTimestamp
        
        if elapsed >= 1.0 {
            let fps = Double(frameCount) / elapsed
            currentFPS = fps
            
            fpsHistory.append(fps)
            if fpsHistory.count > maxHistorySize {
                fpsHistory.removeFirst()
            }
            
            averageFPS = fpsHistory.reduce(0, +) / Double(fpsHistory.count)
            
            frameCount = 0
            lastTimestamp = displayLink.timestamp
            
            updateMemoryUsage()
            updateCPUUsage()
            
            if fps < 60 {
                logger.warning("Low FPS detected: \(fps, format: .fixed(precision: 1))")
            }
        }
    }
    
    private func updateMemoryUsage() {
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
            memoryUsage = Double(info.resident_size) / 1024.0 / 1024.0 // Convert to MB
        }
    }
    
    private func updateCPUUsage() {
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
            // Simple CPU usage calculation
            cpuUsage = Double(info.user_time.seconds + info.system_time.seconds)
        }
    }
}

// MARK: - Image Cache Manager

class ImageCacheManager {
    static let shared = ImageCacheManager()
    
    private let cache = NSCache<NSString, UIImage>()
    private let ioQueue = DispatchQueue(label: "com.scal.imagecache", attributes: .concurrent)
    
    init() {
        cache.countLimit = 100
        cache.totalCostLimit = 100 * 1024 * 1024 // 100MB
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(clearCache),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
    }
    
    func image(for key: String) -> UIImage? {
        cache.object(forKey: key as NSString)
    }
    
    func store(_ image: UIImage, for key: String) {
        let cost = image.jpegData(compressionQuality: 1.0)?.count ?? 0
        cache.setObject(image, forKey: key as NSString, cost: cost)
    }
    
    func prefetchImages(urls: [URL]) {
        ioQueue.async {
            for url in urls {
                let key = url.absoluteString
                if self.cache.object(forKey: key as NSString) == nil {
                    // Load image asynchronously
                    URLSession.shared.dataTask(with: url) { data, _, _ in
                        if let data = data, let image = UIImage(data: data) {
                            self.store(image, for: key)
                        }
                    }.resume()
                }
            }
        }
    }
    
    @objc private func clearCache() {
        cache.removeAllObjects()
    }
}

// MARK: - Lazy Loading List

struct LazyLoadingList<Item: Identifiable, Content: View>: View {
    let items: [Item]
    let batchSize: Int
    let content: (Item) -> Content
    
    @State private var visibleItems: [Item] = []
    @State private var loadedCount = 0
    
    init(items: [Item], batchSize: Int = 20, @ViewBuilder content: @escaping (Item) -> Content) {
        self.items = items
        self.batchSize = batchSize
        self.content = content
    }
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(visibleItems) { item in
                    content(item)
                        .onAppear {
                            loadMoreIfNeeded(item)
                        }
                }
                
                if loadedCount < items.count {
                    ProgressView()
                        .frame(height: 50)
                        .onAppear {
                            loadNextBatch()
                        }
                }
            }
            .padding()
        }
        .onAppear {
            loadInitialBatch()
        }
    }
    
    private func loadInitialBatch() {
        let endIndex = min(batchSize, items.count)
        visibleItems = Array(items[0..<endIndex])
        loadedCount = endIndex
    }
    
    private func loadNextBatch() {
        let startIndex = loadedCount
        let endIndex = min(loadedCount + batchSize, items.count)
        
        if startIndex < endIndex {
            let newItems = Array(items[startIndex..<endIndex])
            
            withAnimation(.easeOut(duration: 0.3)) {
                visibleItems.append(contentsOf: newItems)
                loadedCount = endIndex
            }
        }
    }
    
    private func loadMoreIfNeeded(_ item: Item) {
        if let index = visibleItems.firstIndex(where: { $0.id == item.id }),
           index >= visibleItems.count - 5 {
            loadNextBatch()
        }
    }
}

// MARK: - Optimized Animation Modifiers

extension View {
    func optimizedAnimation<V>(_ animation: Animation? = .default, value: V) -> some View where V: Equatable {
        self.modifier(OptimizedAnimationModifier(animation: animation, value: value))
    }
    
    func renderingOptimized() -> some View {
        self.modifier(RenderingOptimizationModifier())
    }
    
    func preloadContent() -> some View {
        self.modifier(PreloadContentModifier())
    }
}

struct OptimizedAnimationModifier<V: Equatable>: ViewModifier {
    let animation: Animation?
    let value: V
    
    func body(content: Content) -> some View {
        content
            .animation(animation, value: value)
            .drawingGroup() // Flatten view hierarchy for better performance
    }
}

struct RenderingOptimizationModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .drawingGroup()
            .compositingGroup()
            .clipped()
    }
}

struct PreloadContentModifier: ViewModifier {
    @State private var hasAppeared = false
    
    func body(content: Content) -> some View {
        content
            .onAppear {
                hasAppeared = true
            }
            .opacity(hasAppeared ? 1 : 0.99) // Force pre-render
    }
}

// MARK: - Throttled Publisher

extension Publisher where Failure == Never {
    func throttleLatest<S: Scheduler>(
        for interval: S.SchedulerTimeType.Stride,
        scheduler: S
    ) -> AnyPublisher<Output, Never> {
        self
            .throttle(for: interval, scheduler: scheduler, latest: true)
            .eraseToAnyPublisher()
    }
}

// MARK: - Memory-Efficient Data Loading

@MainActor
class DataPrefetcher<T> {
    private var cache: [String: T] = [:]
    private let maxCacheSize: Int
    private var accessOrder: [String] = []
    
    init(maxCacheSize: Int = 50) {
        self.maxCacheSize = maxCacheSize
    }
    
    func prefetch(keys: [String], loader: @escaping (String) async -> T?) {
        Task {
            for key in keys where cache[key] == nil {
                if let data = await loader(key) {
                    store(data, for: key)
                }
            }
        }
    }
    
    func get(_ key: String) -> T? {
        if let data = cache[key] {
            // Move to end of access order
            accessOrder.removeAll { $0 == key }
            accessOrder.append(key)
            return data
        }
        return nil
    }
    
    private func store(_ data: T, for key: String) {
        // Evict oldest if needed
        if cache.count >= maxCacheSize, let oldest = accessOrder.first {
            cache.removeValue(forKey: oldest)
            accessOrder.removeFirst()
        }
        
        cache[key] = data
        accessOrder.append(key)
    }
    
    func clear() {
        cache.removeAll()
        accessOrder.removeAll()
    }
}

// MARK: - Smooth Scrolling Helper

struct SmoothScrollView<Content: View>: UIViewRepresentable {
    let content: Content
    let showsIndicators: Bool
    
    init(showsIndicators: Bool = true, @ViewBuilder content: () -> Content) {
        self.showsIndicators = showsIndicators
        self.content = content()
    }
    
    func makeUIView(context: Context) -> UIScrollView {
        let scrollView = UIScrollView()
        scrollView.showsVerticalScrollIndicator = showsIndicators
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.decelerationRate = .fast
        
        // Enable 120Hz scrolling
        if #available(iOS 15.0, *) {
            scrollView.maximumZoomScale = 1.0
            scrollView.minimumZoomScale = 1.0
        }
        
        let hostingController = UIHostingController(rootView: content)
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        
        scrollView.addSubview(hostingController.view)
        
        NSLayoutConstraint.activate([
            hostingController.view.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            hostingController.view.topAnchor.constraint(equalTo: scrollView.topAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            hostingController.view.widthAnchor.constraint(equalTo: scrollView.widthAnchor)
        ])
        
        return scrollView
    }
    
    func updateUIView(_ uiView: UIScrollView, context: Context) {
        // Update content if needed
    }
}

// MARK: - Batch Operations

class BatchOperationQueue {
    private let queue = DispatchQueue(label: "com.scal.batch", attributes: .concurrent)
    private let semaphore: DispatchSemaphore
    
    init(maxConcurrent: Int = 3) {
        self.semaphore = DispatchSemaphore(value: maxConcurrent)
    }
    
    func addOperation<T>(_ operation: @escaping () async throws -> T) async throws -> T {
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                self.semaphore.wait()
                
                Task {
                    do {
                        let result = try await operation()
                        self.semaphore.signal()
                        continuation.resume(returning: result)
                    } catch {
                        self.semaphore.signal()
                        continuation.resume(throwing: error)
                    }
                }
            }
        }
    }
    
    func addBatch<T>(_ operations: [() async throws -> T]) async throws -> [T] {
        try await withThrowingTaskGroup(of: T.self) { group in
            for operation in operations {
                group.addTask {
                    try await self.addOperation(operation)
                }
            }
            
            var results: [T] = []
            for try await result in group {
                results.append(result)
            }
            
            return results
        }
    }
}

// MARK: - View Performance Debugging

#if DEBUG
struct PerformanceOverlay: View {
    @StateObject private var monitor = PerformanceMonitor.shared
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("FPS: \(monitor.currentFPS, specifier: "%.1f")")
                .foregroundColor(monitor.currentFPS >= 60 ? .green : .red)
            
            Text("Avg: \(monitor.averageFPS, specifier: "%.1f")")
                .foregroundColor(monitor.averageFPS >= 60 ? .green : .orange)
            
            Text("Mem: \(monitor.memoryUsage, specifier: "%.1f") MB")
                .foregroundColor(monitor.memoryUsage < 200 ? .green : .orange)
        }
        .font(.system(size: 10, design: .monospaced))
        .padding(8)
        .background(Color.black.opacity(0.8))
        .cornerRadius(8)
    }
}

extension View {
    func performanceOverlay() -> some View {
        self.overlay(
            PerformanceOverlay()
                .allowsHitTesting(false),
            alignment: .topTrailing
        )
    }
}
#endif