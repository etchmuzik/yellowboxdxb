//
//  MultiFoodDetector.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Advanced ML-powered multiple food detection and segmentation
//

import SwiftUI
import Vision
import CoreML
import MLKitImageLabeling

#if canImport(MLKitObjectDetection) && canImport(MLKitImageSegmentation)
import MLKitObjectDetection
import MLKitImageSegmentation
#endif

// MARK: - Food Detection Models

struct DetectedFoodItem: Identifiable {
    let id = UUID()
    let name: String
    let confidence: Float
    let boundingBox: CGRect
    let nutritionInfo: NutritionInfo?
    let quantity: String
    let calories: Int
    
    var displayConfidence: String {
        "\(Int(confidence * 100))%"
    }
}

struct NutritionInfo {
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let serving: String
}

struct MealComposition {
    let items: [DetectedFoodItem]
    let totalCalories: Int
    let totalProtein: Double
    let totalCarbs: Double
    let totalFat: Double
    let mealType: MealType
    let confidence: Float
    
    enum MealType: String {
        case breakfast = "Breakfast"
        case lunch = "Lunch"
        case dinner = "Dinner"
        case snack = "Snack"
        case unknown = "Meal"
    }
}

// MARK: - Multi-Food Detector

#if canImport(MLKitObjectDetection) && canImport(MLKitImageSegmentation)

@MainActor
class MultiFoodDetector: ObservableObject {
    static let shared = MultiFoodDetector()
    
    @Published var isProcessing = false
    @Published var detectedItems: [DetectedFoodItem] = []
    @Published var mealComposition: MealComposition?
    @Published var processingProgress: Double = 0.0
    @Published var currentStep = ProcessingStep.idle
    
    enum ProcessingStep: String {
        case idle = "Ready"
        case detecting = "Detecting objects..."
        case segmenting = "Segmenting food items..."
        case identifying = "Identifying foods..."
        case analyzing = "Analyzing nutrition..."
        case complete = "Analysis complete"
    }
    
    // ML Kit detectors
    private lazy var objectDetector: ObjectDetector = {
        let options = ObjectDetectorOptions()
        options.shouldEnableMultipleObjects = true
        options.shouldEnableClassification = true
        options.detectorMode = .singleImage
        return ObjectDetector.objectDetector(options: options)
    }()
    
    private lazy var imageLabeler: ImageLabeler = {
        let options = ImageLabelerOptions()
        options.confidenceThreshold = 0.7
        return ImageLabeler.imageLabeler(options: options)
    }()
    
    private lazy var segmenter: ImageSegmenter = {
        let options = SelfieSegmenterOptions()
        options.segmenterMode = .singleImage
        return ImageSegmenter.imageSegmenter(options: options)
    }()
    
    // Food database service
    private let foodService = SimpleFoodSearchService.shared
    
    // MARK: - Public Methods
    
    func detectFoodsInImage(_ image: UIImage) async throws -> MealComposition {
        await MainActor.run {
            isProcessing = true
            detectedItems = []
            processingProgress = 0.0
            currentStep = .detecting
        }
        
        do {
            // Step 1: Object Detection
            let objects = try await detectObjects(in: image)
            await updateProgress(0.25, step: .segmenting)
            
            // Step 2: Image Segmentation
            let segments = try await segmentImage(image)
            await updateProgress(0.5, step: .identifying)
            
            // Step 3: Food Identification
            let foodItems = try await identifyFoods(from: objects, in: image)
            await updateProgress(0.75, step: .analyzing)
            
            // Step 4: Nutrition Analysis
            let nutritionData = try await analyzeFoodNutrition(foodItems)
            await updateProgress(1.0, step: .complete)
            
            // Compose final meal data
            let composition = composeMeal(from: nutritionData)
            
            await MainActor.run {
                self.detectedItems = nutritionData
                self.mealComposition = composition
                self.isProcessing = false
            }
            
            return composition
            
        } catch {
            await MainActor.run {
                self.isProcessing = false
                self.currentStep = .idle
            }
            throw error
        }
    }
    
    // MARK: - Detection Pipeline
    
    private func detectObjects(in image: UIImage) async throws -> [Object] {
        let visionImage = VisionImage(image: image)
        visionImage.orientation = image.imageOrientation
        
        return try await withCheckedThrowingContinuation { continuation in
            objectDetector.process(visionImage) { objects, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: objects ?? [])
                }
            }
        }
    }
    
    private func segmentImage(_ image: UIImage) async throws -> SegmentationMask? {
        let visionImage = VisionImage(image: image)
        visionImage.orientation = image.imageOrientation
        
        return try await withCheckedThrowingContinuation { continuation in
            segmenter.process(visionImage) { mask, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: mask)
                }
            }
        }
    }
    
    private func identifyFoods(from objects: [Object], in image: UIImage) async throws -> [(food: String, confidence: Float, box: CGRect)] {
        var identifiedFoods: [(food: String, confidence: Float, box: CGRect)] = []
        
        // Process each detected object
        for object in objects {
            // Crop the image to the object's bounding box
            let croppedImage = cropImage(image, to: object.frame)
            
            // Get labels for the cropped region
            let labels = try await getLabels(for: croppedImage)
            
            // Filter for food-related labels
            let foodLabels = labels.filter { isFoodLabel($0.text) }
            
            if let bestMatch = foodLabels.first {
                identifiedFoods.append((
                    food: bestMatch.text,
                    confidence: bestMatch.confidence,
                    box: object.frame
                ))
            }
        }
        
        // If no objects detected, analyze the whole image
        if identifiedFoods.isEmpty {
            let labels = try await getLabels(for: image)
            let foodLabels = labels.filter { isFoodLabel($0.text) }
            
            // Group similar foods and estimate portions
            let groupedFoods = groupFoodLabels(foodLabels, imageSize: image.size)
            identifiedFoods = groupedFoods
        }
        
        return identifiedFoods
    }
    
    private func getLabels(for image: UIImage) async throws -> [ImageLabel] {
        let visionImage = VisionImage(image: image)
        visionImage.orientation = image.imageOrientation
        
        return try await withCheckedThrowingContinuation { continuation in
            imageLabeler.process(visionImage) { labels, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: labels ?? [])
                }
            }
        }
    }
    
    private func analyzeFoodNutrition(_ items: [(food: String, confidence: Float, box: CGRect)]) async throws -> [DetectedFoodItem] {
        var nutritionItems: [DetectedFoodItem] = []
        
        for item in items {
            // Search for nutrition info
            if let nutritionInfo = try? await searchFoodNutrition(item.food) {
                let quantity = estimateQuantity(from: item.box)
                let adjustedCalories = adjustCaloriesForQuantity(
                    baseCalories: nutritionInfo.calories,
                    quantity: quantity
                )
                
                let detectedItem = DetectedFoodItem(
                    name: item.food.capitalized,
                    confidence: item.confidence,
                    boundingBox: item.box,
                    nutritionInfo: nutritionInfo,
                    quantity: quantity,
                    calories: adjustedCalories
                )
                
                nutritionItems.append(detectedItem)
            }
        }
        
        return nutritionItems
    }
    
    private func searchFoodNutrition(_ foodName: String) async throws -> NutritionInfo? {
        // Search using the food service
        let results = try await foodService.searchFood(foodName)
        
        guard let firstResult = results.first else { return nil }
        
        return NutritionInfo(
            calories: firstResult.calories,
            protein: firstResult.protein,
            carbs: firstResult.carbs,
            fat: firstResult.fat,
            serving: firstResult.serving ?? "1 serving"
        )
    }
    
    // MARK: - Helper Methods
    
    private func cropImage(_ image: UIImage, to rect: CGRect) -> UIImage {
        guard let cgImage = image.cgImage else { return image }
        
        let scale = image.scale
        let scaledRect = CGRect(
            x: rect.origin.x * scale,
            y: rect.origin.y * scale,
            width: rect.size.width * scale,
            height: rect.size.height * scale
        )
        
        guard let croppedCGImage = cgImage.cropping(to: scaledRect) else { return image }
        
        return UIImage(cgImage: croppedCGImage, scale: scale, orientation: image.imageOrientation)
    }
    
    private func isFoodLabel(_ label: String) -> Bool {
        let foodKeywords = [
            "food", "meal", "dish", "cuisine", "vegetable", "fruit", "meat",
            "bread", "rice", "pasta", "salad", "soup", "sandwich", "burger",
            "pizza", "chicken", "beef", "fish", "egg", "cheese", "milk",
            "yogurt", "cereal", "snack", "dessert", "cake", "cookie"
        ]
        
        let lowercased = label.lowercased()
        return foodKeywords.contains { lowercased.contains($0) }
    }
    
    private func groupFoodLabels(_ labels: [ImageLabel], imageSize: CGSize) -> [(food: String, confidence: Float, box: CGRect)] {
        // Group similar labels and estimate their positions
        var grouped: [(food: String, confidence: Float, box: CGRect)] = []
        var processedLabels = Set<String>()
        
        for label in labels {
            if !processedLabels.contains(label.text) {
                processedLabels.insert(label.text)
                
                // Estimate bounding box (divide image into regions)
                let estimatedBox = estimateBoundingBox(
                    for: label.text,
                    in: imageSize,
                    index: grouped.count
                )
                
                grouped.append((
                    food: label.text,
                    confidence: label.confidence,
                    box: estimatedBox
                ))
            }
        }
        
        return grouped
    }
    
    private func estimateBoundingBox(for food: String, in imageSize: CGSize, index: Int) -> CGRect {
        // Simple grid-based estimation
        let columns = 2
        let rows = 2
        
        let cellWidth = imageSize.width / CGFloat(columns)
        let cellHeight = imageSize.height / CGFloat(rows)
        
        let col = index % columns
        let row = index / columns
        
        return CGRect(
            x: CGFloat(col) * cellWidth,
            y: CGFloat(row) * cellHeight,
            width: cellWidth,
            height: cellHeight
        )
    }
    
    private func estimateQuantity(from boundingBox: CGRect) -> String {
        // Estimate based on bounding box size
        let area = boundingBox.width * boundingBox.height
        
        if area < 10000 {
            return "Small portion"
        } else if area < 20000 {
            return "Medium portion"
        } else {
            return "Large portion"
        }
    }
    
    private func adjustCaloriesForQuantity(baseCalories: Int, quantity: String) -> Int {
        switch quantity {
        case "Small portion":
            return Int(Double(baseCalories) * 0.75)
        case "Large portion":
            return Int(Double(baseCalories) * 1.5)
        default:
            return baseCalories
        }
    }
    
    private func composeMeal(from items: [DetectedFoodItem]) -> MealComposition {
        let totalCalories = items.reduce(0) { $0 + $1.calories }
        let totalProtein = items.reduce(0.0) { $0 + ($1.nutritionInfo?.protein ?? 0) }
        let totalCarbs = items.reduce(0.0) { $0 + ($1.nutritionInfo?.carbs ?? 0) }
        let totalFat = items.reduce(0.0) { $0 + ($1.nutritionInfo?.fat ?? 0) }
        
        let avgConfidence = items.isEmpty ? 0 : 
            items.reduce(0) { $0 + $1.confidence } / Float(items.count)
        
        let mealType = determineMealType(from: items)
        
        return MealComposition(
            items: items,
            totalCalories: totalCalories,
            totalProtein: totalProtein,
            totalCarbs: totalCarbs,
            totalFat: totalFat,
            mealType: mealType,
            confidence: avgConfidence
        )
    }
    
    private func determineMealType(from items: [DetectedFoodItem]) -> MealComposition.MealType {
        let hour = Calendar.current.component(.hour, from: Date())
        
        // Simple time-based classification
        switch hour {
        case 5...10:
            return .breakfast
        case 11...14:
            return .lunch
        case 17...21:
            return .dinner
        default:
            return .snack
        }
    }
    
    private func updateProgress(_ progress: Double, step: ProcessingStep) async {
        await MainActor.run {
            self.processingProgress = progress
            self.currentStep = step
        }
    }
}

#else

@MainActor
class MultiFoodDetector: ObservableObject {
    static let shared = MultiFoodDetector()
    
    @Published var isProcessing = false
    @Published var detectedItems: [DetectedFoodItem] = []
    @Published var mealComposition: MealComposition?
    @Published var processingProgress: Double = 0.0
    @Published var currentStep = ProcessingStep.idle
    
    enum ProcessingStep: String {
        case idle = "Ready"
        case detecting = "Detecting objects..."
        case segmenting = "Segmenting food items..."
        case identifying = "Identifying foods..."
        case analyzing = "Analyzing nutrition..."
        case complete = "Analysis complete"
    }
    
    func process(image: UIImage?) async {
        await MainActor.run {
            self.isProcessing = false
            self.detectedItems = []
            self.mealComposition = nil
            self.processingProgress = 1.0
            self.currentStep = .complete
        }
    }
    
    func analyze(image: UIImage?) async {
        await process(image: image)
    }
    
    func reset() {
        isProcessing = false
        detectedItems.removeAll()
        mealComposition = nil
        processingProgress = 0.0
        currentStep = .idle
    }
}

#endif

// MARK: - Error Types

enum MultiFoodDetectionError: LocalizedError {
    case noFoodsDetected
    case processingFailed
    case nutritionDataUnavailable
    
    var errorDescription: String? {
        switch self {
        case .noFoodsDetected:
            return "No food items could be detected in the image"
        case .processingFailed:
            return "Failed to process the image"
        case .nutritionDataUnavailable:
            return "Could not retrieve nutrition information"
        }
    }
}
