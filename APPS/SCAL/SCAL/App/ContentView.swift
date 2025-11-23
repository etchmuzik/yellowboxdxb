//
//  ContentView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Main tab navigation view
//

import SwiftUI
import Alamofire
import Foundation
import Combine
import CoreData
import AVFoundation
import MLKitImageLabeling
import MLKitVision
import HealthKit
import Speech
import CloudKit
import NaturalLanguage
import StoreKit

// MARK: - SCAL Design System

// Adaptive Colors for Light and Dark Mode
extension Color {
    // Primary brand colors - same in both modes
    static let calPrimary = Color(red: 0.4, green: 0.8, blue: 0.4) // Fresh green (#66CC66)
    static let calSecondary = Color(red: 0.2, green: 0.6, blue: 0.2) // Dark green (#339933)

    // Adaptive backgrounds - respond to color scheme
    static let calBackground = Color(uiColor: .systemBackground) // White in light, black in dark
    static let calSecondaryBackground = Color(uiColor: .secondarySystemBackground) // Light gray / dark gray
    static let calCardBg = Color(uiColor: .secondarySystemGroupedBackground) // Card backgrounds

    // Adaptive text colors
    static let calTextPrimary = Color(uiColor: .label) // Black in light, white in dark
    static let calTextSecondary = Color(uiColor: .secondaryLabel) // Gray adaptive
    static let calTextTertiary = Color(uiColor: .tertiaryLabel) // Lighter gray adaptive

    // Accent color - slightly dimmed in dark mode
    static let calAccent = Color(red: 1.0, green: 0.8, blue: 0.2) // Gold/yellow

    // Separator and borders
    static let calSeparator = Color(uiColor: .separator) // Adaptive separator
    static let calBorder = Color(uiColor: .systemGray4) // Adaptive border
}

// Modern Card Style
extension View {
    func calCard() -> some View {
        self.modifier(CalCardModifier())
    }
    
    func calPrimaryButton() -> some View {
        self.modifier(CalPrimaryButtonStyle())
    }
    
    func calSecondaryButton() -> some View {
        self.modifier(CalSecondaryButtonStyle())
    }
}

struct CalCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.calCardBg)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}

struct CalPrimaryButtonStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundColor(.white)
            .fontWeight(.semibold)
            .padding(.horizontal, 32)
            .padding(.vertical, 16)
            .background(
                LinearGradient(
                    colors: [Color.calPrimary, Color.calSecondary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(28)
            .shadow(color: Color.calPrimary.opacity(0.3), radius: 8, x: 0, y: 4)
    }
}

struct CalSecondaryButtonStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundColor(.calPrimary)
            .fontWeight(.medium)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.calPrimary.opacity(0.1))
            .cornerRadius(20)
    }
}

// Navigation Bar Component
struct CalNavigationBar: View {
    let title: String
    let showBackButton: Bool
    let backAction: (() -> Void)?
    let rightButton: AnyView?
    
    init(title: String, showBackButton: Bool = false, backAction: (() -> Void)? = nil, rightButton: AnyView? = nil) {
        self.title = title
        self.showBackButton = showBackButton
        self.backAction = backAction
        self.rightButton = rightButton
    }
    
    var body: some View {
        HStack {
            if showBackButton {
                Button(action: { backAction?() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.calTextPrimary)
                        .frame(width: 44, height: 44)
                }
            }
            
            Text(title)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.calTextPrimary)
            
            Spacer()
            
            if let rightButton = rightButton {
                rightButton
            }
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .background(Color.calBackground)
    }
}

// Progress Ring Component
struct CalProgressRing: View {
    let progress: Double
    let lineWidth: CGFloat
    let size: CGFloat
    let primaryColor: Color
    let backgroundColor: Color
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(backgroundColor, lineWidth: lineWidth)
                .frame(width: size, height: size)
            
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    LinearGradient(
                        colors: [primaryColor, primaryColor.opacity(0.7)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.6, dampingFraction: 0.8), value: progress)
        }
    }
}

// Simple Food Model for API Integration
struct SimpleFood: Identifiable, Hashable, Codable {
    var id = UUID()
    let name: String
    let brand: String?
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let fdcId: Int?
    var confidence: Float? = nil  // ML Kit confidence score
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: SimpleFood, rhs: SimpleFood) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Voice Recognition Manager
@MainActor
class VoiceRecognitionManager: ObservableObject {
    static let shared = VoiceRecognitionManager()
    
    @Published var isRecording = false
    @Published var recognizedText = ""
    @Published var isAuthorized = false
    @Published var errorMessage: String?
    
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    
    init() {
        requestAuthorization()
        setupMultilingualRecognizer()
    }
    
    private func setupMultilingualRecognizer() {
        // Try to set up Arabic recognizer as well
        if SFSpeechRecognizer(locale: Locale(identifier: "ar-AE")) != nil {
            print("Arabic recognizer available")
        }
    }
    
    func requestAuthorization() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            Task { @MainActor in
                switch authStatus {
                case .authorized:
                    self.isAuthorized = true
                case .denied:
                    self.errorMessage = "Speech recognition denied"
                case .restricted:
                    self.errorMessage = "Speech recognition restricted"
                case .notDetermined:
                    self.errorMessage = "Speech recognition not determined"
                @unknown default:
                    self.errorMessage = "Unknown authorization status"
                }
            }
        }
    }
    
    func startRecording() throws {
        // Cancel previous task if running
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        // Create new recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        
        // Setup recognition request
        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.requiresOnDeviceRecognition = false
        
        // Get audio input
        let inputNode = audioEngine.inputNode
        
        // Create recognition task
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
            var isFinal = false
            
            if let result = result {
                self.recognizedText = result.bestTranscription.formattedString
                isFinal = result.isFinal
            }
            
            if error != nil || isFinal {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                
                self.recognitionTask = nil
                self.recognitionRequest = nil
                
                if isFinal {
                    // Process the final text
                    self.processFoodFromSpeech(self.recognizedText)
                }
            }
        }
        
        // Configure audio input
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        // Start audio engine
        audioEngine.prepare()
        try audioEngine.start()
        
        isRecording = true
        recognizedText = ""
    }
    
    func stopRecording() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        isRecording = false
    }
    
    private func processFoodFromSpeech(_ text: String) {
        // Use Apple's NaturalLanguage framework for intelligent food extraction
        let extractedFoods = extractFoodItemsUsingNLP(from: text)

        // If no foods extracted via NLP, fall back to legacy method
        let foodItems = extractedFoods.isEmpty ? [extractFoodWithLegacyMethod(from: text)] : extractedFoods

        // Post notification with ALL extracted food items (not just first)
        NotificationCenter.default.post(
            name: NSNotification.Name("VoiceRecognitionCompleted"),
            object: nil,
            userInfo: ["foodItems": foodItems, "originalText": text]
        )
    }

    // MARK: - NLP Food Extraction (NEW - Apple NaturalLanguage Framework)

    private func extractFoodItemsUsingNLP(from text: String) -> [String] {
        var extractedFoods: [String] = []

        // Create linguistic tagger for NLP analysis
        let tagger = NLTagger(tagSchemes: [.lexicalClass, .nameType])
        tagger.string = text

        // Set language hint for better accuracy
        let options: NLTagger.Options = [.omitPunctuation, .omitWhitespace, .joinNames]

        // Extract nouns and noun phrases (likely food items)
        var nouns: [(String, Range<String.Index>)] = []

        tagger.enumerateTags(in: text.startIndex..<text.endIndex, unit: .word, scheme: .lexicalClass, options: options) { tag, tokenRange in
            if let tag = tag {
                let token = String(text[tokenRange])

                // Collect nouns (food items are typically nouns)
                if tag == .noun || tag == .adjective {
                    nouns.append((token.lowercased(), tokenRange))
                }
            }
            return true
        }

        // Build noun phrases (e.g., "grilled chicken", "brown rice")
        var currentPhrase: [String] = []
        var lastEndIndex: String.Index?

        for (noun, range) in nouns {
            // Check if this noun is adjacent to the previous one
            if let lastEnd = lastEndIndex, range.lowerBound == lastEnd ||
               text[lastEnd..<range.lowerBound].trimmingCharacters(in: .whitespaces).isEmpty {
                currentPhrase.append(noun)
            } else {
                // Save previous phrase if it exists
                if !currentPhrase.isEmpty {
                    extractedFoods.append(currentPhrase.joined(separator: " "))
                }
                currentPhrase = [noun]
            }
            lastEndIndex = range.upperBound
        }

        // Add final phrase
        if !currentPhrase.isEmpty {
            extractedFoods.append(currentPhrase.joined(separator: " "))
        }

        // Filter out common non-food words
        let stopWords = ["i", "me", "my", "we", "you", "he", "she", "it", "they",
                        "am", "is", "are", "was", "were", "be", "been", "being",
                        "have", "has", "had", "do", "does", "did", "will", "would",
                        "could", "should", "may", "might", "must", "can",
                        "this", "that", "these", "those", "what", "which", "who",
                        "when", "where", "why", "how", "all", "each", "every",
                        "both", "few", "more", "most", "other", "some", "such"]

        extractedFoods = extractedFoods.filter { food in
            let words = food.components(separatedBy: " ")
            return !words.allSatisfy { stopWords.contains($0) }
        }

        // Apply GCC food mappings for regional cuisine
        let gccFoodMappings = [
            "shwarma": "shawarma",
            "shawerma": "shawarma",
            "humus": "hummus",
            "hommos": "hummus",
            "labne": "labneh",
            "falafel sandwich": "falafel",
            "biryani rice": "biryani",
            "arabic coffee": "arabic coffee",
            "turkish coffee": "arabic coffee",
            "mandi rice": "mandi",
            "kabsa rice": "kabsa"
        ]

        extractedFoods = extractedFoods.map { food in
            var corrected = food
            for (spoken, correct) in gccFoodMappings {
                if corrected.contains(spoken) {
                    corrected = corrected.replacingOccurrences(of: spoken, with: correct)
                }
            }
            return corrected
        }

        return extractedFoods.filter { !$0.isEmpty }
    }

    // MARK: - Legacy Food Extraction (Fallback)

    private func extractFoodWithLegacyMethod(from text: String) -> String {
        // Fallback to simple pattern matching if NLP doesn't find anything
        let lowercasedText = text.lowercased()

        // Common patterns to remove
        let patterns = [
            "i ate ", "i had ", "just ate ", "just had ", "i'm eating ",
            "i'm having ", "for breakfast ", "for lunch ", "for dinner ",
            "for snack ", "i drank ", "i'm drinking ", "ordered ", "got "
        ]

        var cleanedText = lowercasedText
        for pattern in patterns {
            cleanedText = cleanedText.replacingOccurrences(of: pattern, with: "")
        }

        // Remove common filler words at the beginning
        let fillerWords = ["a ", "an ", "some ", "the ", "one ", "two ", "three "]
        for word in fillerWords {
            if cleanedText.hasPrefix(word) {
                cleanedText = String(cleanedText.dropFirst(word.count))
            }
        }

        // Clean up the text
        cleanedText = cleanedText.trimmingCharacters(in: .whitespacesAndNewlines)

        return cleanedText
    }
}

// MARK: - CloudKit Manager
@MainActor
class CloudKitManager: ObservableObject {
    static let shared = CloudKitManager()
    
    @Published var isSyncing = false
    @Published var isAvailable = false
    @Published var lastSyncDate: Date?
    @Published var syncError: String?
    
    private let container = CKContainer.default()
    private let privateDatabase = CKContainer.default().privateCloudDatabase
    private let recordType = "Meal"
    private let zoneID = CKRecordZone.ID(zoneName: "MealsZone", ownerName: CKCurrentUserDefaultName)
    
    init() {
        checkAccountStatus()
        createCustomZone()
    }
    
    private func checkAccountStatus() {
        container.accountStatus { [weak self] status, error in
            Task { @MainActor in
                switch status {
                case .available:
                    self?.isAvailable = true
                case .noAccount:
                    self?.syncError = "iCloud account not available"
                    self?.isAvailable = false
                case .restricted:
                    self?.syncError = "iCloud access restricted"
                    self?.isAvailable = false
                case .temporarilyUnavailable:
                    self?.syncError = "iCloud temporarily unavailable"
                    self?.isAvailable = false
                case .couldNotDetermine:
                    self?.syncError = "Could not determine iCloud status"
                    self?.isAvailable = false
                @unknown default:
                    self?.isAvailable = false
                }
            }
        }
    }
    
    private func createCustomZone() {
        let zone = CKRecordZone(zoneID: zoneID)
        let operation = CKModifyRecordZonesOperation(
            recordZonesToSave: [zone],
            recordZoneIDsToDelete: nil
        )
        
        operation.modifyRecordZonesResultBlock = { result in
            switch result {
            case .success:
                print("CloudKit zone created successfully")
            case .failure(let error):
                print("Failed to create CloudKit zone: \(error)")
            }
        }
        
        privateDatabase.add(operation)
    }
    
    // Save meal to CloudKit
    func saveMealToCloud(_ meal: SimpleMeal) async throws {
        guard isAvailable else { return }
        
        let recordID = CKRecord.ID(
            recordName: meal.id.uuidString,
            zoneID: zoneID
        )
        
        let record = CKRecord(recordType: recordType, recordID: recordID)
        record["name"] = meal.name
        record["calories"] = meal.calories
        record["protein"] = meal.protein
        record["carbs"] = meal.carbs
        record["fat"] = meal.fat
        record["time"] = meal.time
        record["date"] = Date()
        
        do {
            let _ = try await privateDatabase.save(record)
            print("Meal saved to CloudKit: \(meal.name)")
        } catch {
            print("Failed to save meal to CloudKit: \(error)")
            throw error
        }
    }
    
    // Fetch meals from CloudKit
    func fetchMealsFromCloud(since date: Date? = nil) async throws -> [SimpleMeal] {
        guard isAvailable else { return [] }
        
        isSyncing = true
        defer { isSyncing = false }
        
        let predicate: NSPredicate
        if let date = date {
            predicate = NSPredicate(format: "date > %@", date as NSDate)
        } else {
            // Fetch meals from last 7 days
            let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
            predicate = NSPredicate(format: "date > %@", sevenDaysAgo as NSDate)
        }
        
        let query = CKQuery(recordType: recordType, predicate: predicate)
        query.sortDescriptors = [NSSortDescriptor(key: "date", ascending: false)]
        
        do {
            let results = try await privateDatabase.records(
                matching: query,
                inZoneWith: zoneID,
                desiredKeys: nil,
                resultsLimit: CKQueryOperation.maximumResults
            )

            let meals = results.matchResults.compactMap { (_, result) -> SimpleMeal? in
                switch result {
                case .success(let record):
                    guard let name = record["name"] as? String,
                          let calories = record["calories"] as? Int else { return nil }

                    return SimpleMeal(
                        id: UUID(uuidString: record.recordID.recordName) ?? UUID(),
                        name: name,
                        calories: calories,
                        time: record["time"] as? String ?? "",
                        protein: record["protein"] as? Double ?? 0,
                        carbs: record["carbs"] as? Double ?? 0,
                        fat: record["fat"] as? Double ?? 0
                    )
                case .failure:
                    return nil
                }
            }

            lastSyncDate = Date()
            return meals
        } catch {
            print("Failed to fetch meals from CloudKit: \(error)")
            throw error
        }
    }
    
    // Delete meal from CloudKit
    func deleteMealFromCloud(_ mealID: UUID) async throws {
        guard isAvailable else { return }
        
        let recordID = CKRecord.ID(
            recordName: mealID.uuidString,
            zoneID: zoneID
        )
        
        do {
            let _ = try await privateDatabase.deleteRecord(withID: recordID)
            print("Meal deleted from CloudKit")
        } catch {
            print("Failed to delete meal from CloudKit: \(error)")
            throw error
        }
    }
    
    // Sync all local meals to CloudKit
    func syncAllMeals(_ meals: [SimpleMeal]) async {
        guard isAvailable else { return }
        
        isSyncing = true
        defer { isSyncing = false }
        
        for meal in meals {
            do {
                try await saveMealToCloud(meal)
            } catch {
                print("Failed to sync meal: \(error)")
            }
        }
        
        lastSyncDate = Date()
    }
}

// MARK: - HealthKit Manager
@MainActor
class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()
    
    private let healthStore = HKHealthStore()
    @Published var isAuthorized = false
    @Published var latestWeight: Double?
    @Published var todaysWorkoutCalories: Int = 0
    @Published var todaysWaterIntake: Double = 0
    
    // HealthKit data types we want to access
    private let nutritionTypes: Set<HKSampleType> = [
        HKQuantityType(.dietaryEnergyConsumed),
        HKQuantityType(.dietaryProtein),
        HKQuantityType(.dietaryCarbohydrates),
        HKQuantityType(.dietaryFatTotal),
        HKQuantityType(.dietaryWater)
    ]
    
    private let readTypes: Set<HKObjectType> = [
        HKQuantityType(.bodyMass),
        HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.dietaryWater),
        HKWorkoutType.workoutType()
    ]
    
    private let writeTypes: Set<HKSampleType> = [
        HKQuantityType(.dietaryEnergyConsumed),
        HKQuantityType(.dietaryProtein),
        HKQuantityType(.dietaryCarbohydrates),
        HKQuantityType(.dietaryFatTotal),
        HKQuantityType(.dietaryWater)
    ]
    
    init() {
        checkHealthKitAvailability()
    }
    
    // Check if HealthKit is available
    private func checkHealthKitAvailability() {
        if HKHealthStore.isHealthDataAvailable() {
            requestAuthorization()
        }
    }
    
    // Request HealthKit authorization
    func requestAuthorization() {
        healthStore.requestAuthorization(toShare: writeTypes, read: readTypes) { success, error in
            Task { @MainActor in
                self.isAuthorized = success
                if success {
                    self.loadLatestWeight()
                    self.loadTodaysWorkouts()
                    self.loadTodaysWater()
                }
            }
        }
    }
    
    // Save meal nutrition to HealthKit
    func saveMealNutrition(meal: SimpleMeal, date: Date = Date()) async {
        guard isAuthorized else { return }
        
        // Create nutrition samples
        let samples: [HKQuantitySample] = [
            // Calories
            HKQuantitySample(
                type: HKQuantityType(.dietaryEnergyConsumed),
                quantity: HKQuantity(unit: .kilocalorie(), doubleValue: Double(meal.calories)),
                start: date,
                end: date
            ),
            // Protein
            HKQuantitySample(
                type: HKQuantityType(.dietaryProtein),
                quantity: HKQuantity(unit: .gram(), doubleValue: meal.protein),
                start: date,
                end: date
            ),
            // Carbs
            HKQuantitySample(
                type: HKQuantityType(.dietaryCarbohydrates),
                quantity: HKQuantity(unit: .gram(), doubleValue: meal.carbs),
                start: date,
                end: date
            ),
            // Fat
            HKQuantitySample(
                type: HKQuantityType(.dietaryFatTotal),
                quantity: HKQuantity(unit: .gram(), doubleValue: meal.fat),
                start: date,
                end: date
            )
        ]
        
        // Save to HealthKit
        for sample in samples {
            do {
                try await healthStore.save(sample)
            } catch {
                print("Error saving to HealthKit: \(error)")
            }
        }
    }
    
    // Load latest weight from HealthKit
    func loadLatestWeight() {
        let weightType = HKQuantityType(.bodyMass)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(
            sampleType: weightType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            if let sample = samples?.first as? HKQuantitySample {
                let weightInKg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))
                Task { @MainActor in
                    self.latestWeight = weightInKg
                }
            }
        }
        healthStore.execute(query)
    }
    
    // Load today's workout calories
    func loadTodaysWorkouts() {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: endOfDay,
            options: .strictStartDate
        )
        
        let query = HKSampleQuery(
            sampleType: HKWorkoutType.workoutType(),
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { _, samples, error in
            let totalCalories = (samples as? [HKWorkout])?.reduce(0) { total, workout in
                total + (workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0)
            } ?? 0
            
            Task { @MainActor in
                self.todaysWorkoutCalories = Int(totalCalories)
            }
        }
        healthStore.execute(query)
    }
    
    // Load today's water intake
    func loadTodaysWater() {
        let waterType = HKQuantityType(.dietaryWater)
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: endOfDay,
            options: .strictStartDate
        )
        
        let query = HKStatisticsQuery(
            quantityType: waterType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            let totalWater = result?.sumQuantity()?.doubleValue(for: .liter()) ?? 0
            Task { @MainActor in
                self.todaysWaterIntake = totalWater
            }
        }
        healthStore.execute(query)
    }
    
    // Save water intake
    func saveWaterIntake(liters: Double, date: Date = Date()) async {
        guard isAuthorized else { return }
        
        let sample = HKQuantitySample(
            type: HKQuantityType(.dietaryWater),
            quantity: HKQuantity(unit: .liter(), doubleValue: liters),
            start: date,
            end: date
        )
        
        do {
            try await healthStore.save(sample)
            loadTodaysWater() // Reload to update UI
        } catch {
            print("Error saving water intake: \(error)")
        }
    }
}

// MARK: - GCC Food Database
struct GCCFoodDatabase {
    static let commonFoods: [SimpleFood] = [
        // Arabic Breakfast
        SimpleFood(name: "Foul Medames (فول مدمس)", brand: "Local", calories: 340, protein: 18, carbs: 48, fat: 8, fdcId: nil),
        SimpleFood(name: "Hummus (حمص)", brand: "Local", calories: 177, protein: 8, carbs: 20, fat: 8, fdcId: nil),
        SimpleFood(name: "Labneh (لبنة)", brand: "Local", calories: 85, protein: 5, carbs: 4, fat: 6, fdcId: nil),
        SimpleFood(name: "Zaatar Manakeesh (مناقيش زعتر)", brand: "Local", calories: 290, protein: 8, carbs: 45, fat: 10, fdcId: nil),
        SimpleFood(name: "Cheese Fatayer (فطاير جبنة)", brand: "Local", calories: 320, protein: 12, carbs: 38, fat: 14, fdcId: nil),
        SimpleFood(name: "Shakshuka (شكشوكة)", brand: "Local", calories: 185, protein: 13, carbs: 12, fat: 11, fdcId: nil),
        
        // Main Dishes
        SimpleFood(name: "Chicken Shawarma (شاورما دجاج)", brand: "Local", calories: 475, protein: 35, carbs: 40, fat: 20, fdcId: nil),
        SimpleFood(name: "Beef Shawarma (شاورما لحم)", brand: "Local", calories: 520, protein: 38, carbs: 40, fat: 25, fdcId: nil),
        SimpleFood(name: "Lamb Kebab (كباب لحم)", brand: "Local", calories: 340, protein: 25, carbs: 5, fat: 26, fdcId: nil),
        SimpleFood(name: "Chicken Machboos (مجبوس دجاج)", brand: "Local", calories: 580, protein: 35, carbs: 65, fat: 18, fdcId: nil),
        SimpleFood(name: "Fish Sayadieh (صيادية سمك)", brand: "Local", calories: 420, protein: 32, carbs: 45, fat: 12, fdcId: nil),
        SimpleFood(name: "Lamb Biryani (برياني لحم)", brand: "Local", calories: 620, protein: 28, carbs: 70, fat: 24, fdcId: nil),
        SimpleFood(name: "Chicken Mandi (مندي دجاج)", brand: "Local", calories: 550, protein: 32, carbs: 68, fat: 16, fdcId: nil),
        SimpleFood(name: "Mixed Grill (مشاوي مشكلة)", brand: "Local", calories: 680, protein: 45, carbs: 15, fat: 48, fdcId: nil),
        
        // Sandwiches & Wraps
        SimpleFood(name: "Falafel Sandwich (ساندويش فلافل)", brand: "Local", calories: 350, protein: 14, carbs: 48, fat: 12, fdcId: nil),
        SimpleFood(name: "Karak Chai (شاي كرك)", brand: "Local", calories: 120, protein: 3, carbs: 18, fat: 4, fdcId: nil),
        SimpleFood(name: "Arabic Coffee (قهوة عربية)", brand: "Local", calories: 5, protein: 0, carbs: 1, fat: 0, fdcId: nil),
        
        // Desserts
        SimpleFood(name: "Umm Ali (ام علي)", brand: "Local", calories: 380, protein: 8, carbs: 45, fat: 18, fdcId: nil),
        SimpleFood(name: "Knafeh (كنافة)", brand: "Local", calories: 420, protein: 8, carbs: 52, fat: 22, fdcId: nil),
        SimpleFood(name: "Baklava (بقلاوة)", brand: "Local", calories: 290, protein: 4, carbs: 35, fat: 16, fdcId: nil),
        SimpleFood(name: "Luqaimat (لقيمات)", brand: "Local", calories: 320, protein: 4, carbs: 48, fat: 12, fdcId: nil),
        SimpleFood(name: "Basbousa (بسبوسة)", brand: "Local", calories: 340, protein: 4, carbs: 58, fat: 10, fdcId: nil),
        
        // Drinks
        SimpleFood(name: "Laban (لبن)", brand: "Local", calories: 60, protein: 3, carbs: 4, fat: 3, fdcId: nil),
        SimpleFood(name: "Jallab (جلاب)", brand: "Local", calories: 140, protein: 1, carbs: 35, fat: 0, fdcId: nil),
        SimpleFood(name: "Tamar Hindi (تمر هندي)", brand: "Local", calories: 120, protein: 1, carbs: 30, fat: 0, fdcId: nil),
        
        // Fast Food Chains (Popular in Dubai)
        SimpleFood(name: "Al Baik Chicken Meal", brand: "Al Baik", calories: 720, protein: 45, carbs: 65, fat: 32, fdcId: nil),
        SimpleFood(name: "Zinger Burger", brand: "KFC Arabia", calories: 580, protein: 28, carbs: 52, fat: 28, fdcId: nil),
        SimpleFood(name: "McArabia Chicken", brand: "McDonald's", calories: 420, protein: 27, carbs: 45, fat: 14, fdcId: nil),
        
        // Popular Dubai Restaurant Items
        SimpleFood(name: "Butter Chicken", brand: "Restaurant", calories: 438, protein: 30, carbs: 16, fat: 28, fdcId: nil),
        SimpleFood(name: "Chicken Tikka Masala", brand: "Restaurant", calories: 395, protein: 32, carbs: 18, fat: 22, fdcId: nil),
        SimpleFood(name: "Mutton Rogan Josh", brand: "Restaurant", calories: 520, protein: 35, carbs: 12, fat: 38, fdcId: nil),
        SimpleFood(name: "Palak Paneer", brand: "Restaurant", calories: 340, protein: 16, carbs: 15, fat: 26, fdcId: nil),
        
        // Common Iftar Items
        SimpleFood(name: "Dates (تمر)", brand: "Local", calories: 23, protein: 0.2, carbs: 6, fat: 0, fdcId: nil),
        SimpleFood(name: "Sambousek Cheese (سمبوسك جبنة)", brand: "Local", calories: 180, protein: 6, carbs: 18, fat: 10, fdcId: nil),
        SimpleFood(name: "Harees (هريس)", brand: "Local", calories: 320, protein: 18, carbs: 42, fat: 8, fdcId: nil),
        SimpleFood(name: "Thareed (ثريد)", brand: "Local", calories: 380, protein: 22, carbs: 45, fat: 12, fdcId: nil),
        
        // Juices & Beverages
        SimpleFood(name: "Fresh Orange Juice", brand: "Local", calories: 112, protein: 1.7, carbs: 26, fat: 0.5, fdcId: nil),
        SimpleFood(name: "Avocado Shake", brand: "Local", calories: 280, protein: 4, carbs: 32, fat: 16, fdcId: nil),
        SimpleFood(name: "Mango Lassi", brand: "Local", calories: 210, protein: 5, carbs: 38, fat: 4, fdcId: nil)
    ]
    
    static func searchLocal(_ query: String) -> [SimpleFood] {
        let lowercasedQuery = query.lowercased()
        
        // Search in both English and Arabic names
        return commonFoods.filter { food in
            food.name.lowercased().contains(lowercasedQuery) ||
            food.name.components(separatedBy: "(").first?.lowercased().contains(lowercasedQuery) ?? false
        }
    }
}

// Simple Food Search Service
@MainActor
class SimpleFoodSearchService: ObservableObject {
    static let shared = SimpleFoodSearchService()
    
    @Published var searchResults: [SimpleFood] = []
    @Published var isSearching = false
    @Published var useLocalDatabase = true  // Prioritize local foods
    
    private let apiKey = AppConstants.usdaAPIKey
    private let baseURL = "https://api.nal.usda.gov/fdc/v1"
    private let cacheKey = "cached_foods_search"
    
    // Cache structure: Query -> [SimpleFood]
    private var searchCache: [String: [SimpleFood]] {
        get {
            if let data = UserDefaults.standard.data(forKey: cacheKey),
               let decoded = try? JSONDecoder().decode([String: [SimpleFood]].self, from: data) {
                return decoded
            }
            return [:]
        }
        set {
            if let encoded = try? JSONEncoder().encode(newValue) {
                UserDefaults.standard.set(encoded, forKey: cacheKey)
            }
        }
    }
    
    func searchFood(query: String) async {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else {
            searchResults = []
            return
        }
        
        isSearching = true
        
        // First, search local GCC database
        let localResults = GCCFoodDatabase.searchLocal(trimmedQuery)
        
        // Check cache for offline support
        var cachedResults: [SimpleFood] = []
        if let cached = searchCache[trimmedQuery.lowercased()] {
            cachedResults = cached
        }
        
        // Initial display with local + cached (if any)
        searchResults = localResults + cachedResults
        
        if !localResults.isEmpty && useLocalDatabase {
            // If we found local GCC food, we prioritize it
            // But we still might want to fetch USDA if we want more results
            // For now, let's continue to fetch unless we have a perfect match?
            // The original logic returned early. Let's stick to that for now to be safe,
            // but maybe we should fetch in background.
            isSearching = false
            return
        }
        
        // USDA Search
        let parameters: [String: Any] = [
            "query": trimmedQuery,
            "pageSize": 10,
            "api_key": apiKey
        ]
        
        do {
            let response = try await AF.request("\(baseURL)/foods/search", parameters: parameters)
                .serializingDecodable(USDAResponse.self)
                .value
            
            let usdaResults = response.foods.compactMap { food -> SimpleFood? in
                guard let nutrients = food.foodNutrients else { return nil }
                
                var calories: Double = 0
                var protein: Double = 0
                var carbs: Double = 0
                var fat: Double = 0
                
                for nutrient in nutrients {
                    switch nutrient.nutrientId {
                    case 1008: calories = nutrient.value ?? 0
                    case 1003: protein = nutrient.value ?? 0
                    case 1005: carbs = nutrient.value ?? 0
                    case 1004: fat = nutrient.value ?? 0
                    default: break
                    }
                }
                
                return SimpleFood(
                    name: food.description,
                    brand: food.brandOwner ?? food.brandName,
                    calories: calories,
                    protein: protein,
                    carbs: carbs,
                    fat: fat,
                    fdcId: food.fdcId
                )
            }
            
            // Update Cache
            var currentCache = searchCache
            currentCache[trimmedQuery.lowercased()] = usdaResults
            searchCache = currentCache
            
            // Combine local and USDA results, prioritizing local
            searchResults = localResults + usdaResults
            isSearching = false
        } catch {
            print("Search error: \(error)")
            // If USDA fails (offline), we already set searchResults to local + cached
            // So we just stop searching
            isSearching = false
        }
    }
    
    func searchByBarcode(_ barcode: String) async {
        // USDA uses GTINs (barcodes) in the query
        await searchFood(query: "gtinUpc:\(barcode)")
    }
}

// USDA API Response Models
struct USDAResponse: Codable {
    let foods: [USDAFood]
}

struct USDAFood: Codable {
    let fdcId: Int
    let description: String
    let brandOwner: String?
    let brandName: String?
    let foodNutrients: [USDANutrient]?
}

struct USDANutrient: Codable {
    let nutrientId: Int
    let value: Double?
}

// MARK: - Enhanced Food Detection Service
@MainActor
class FoodDetectionService: ObservableObject {
    static let shared = FoodDetectionService()
    
    @Published var detectionResults: [DetectedFood] = []
    @Published var isProcessing = false
    @Published var confidence: Double = 0
    
    private let foodSearch = SimpleFoodSearchService.shared
    private let imageLabeler: ImageLabeler
    
    // Enhanced food keywords for better detection
    private let foodCategories: [String: [String]] = [
        "breakfast": ["eggs", "bacon", "pancake", "waffle", "cereal", "toast", "oatmeal", "yogurt", "smoothie", "coffee", "muffin", "croissant", "bagel"],
        "lunch": ["sandwich", "burger", "pizza", "salad", "soup", "wrap", "pasta", "rice", "chicken", "fish", "steak"],
        "dinner": ["meat", "vegetables", "potato", "pasta", "rice", "curry", "stew", "roast", "grilled", "baked"],
        "arabic": ["shawarma", "kebab", "falafel", "hummus", "tabbouleh", "fattoush", "kibbeh", "mansaf", "kabsa", "machboos", "biryani", "kofta", "mandi", "harees", "thareed", "luqaimat", "kunafa", "baklava"],
        "asian": ["sushi", "ramen", "noodles", "dumplings", "stir fry", "fried rice", "spring roll", "dim sum", "pad thai", "pho"],
        "dessert": ["cake", "ice cream", "chocolate", "candy", "pie", "cookies", "brownie", "pudding", "fruit", "pastry"],
        "drinks": ["water", "juice", "soda", "tea", "coffee", "smoothie", "milkshake", "lemonade", "cocktail", "beer", "wine"],
        "snacks": ["chips", "nuts", "popcorn", "crackers", "fruit", "vegetables", "cheese", "yogurt", "granola", "protein bar"]
    ]
    
    init() {
        // Configure ML Kit with optimized settings for food
        let options = ImageLabelerOptions()
        options.confidenceThreshold = 0.5  // Lower threshold to catch more potential foods
        self.imageLabeler = ImageLabeler.imageLabeler(options: options)
    }
    
    // Main detection function with enhanced logic
    func detectFood(from image: UIImage) async -> DetectedFood? {
        isProcessing = true
        defer { isProcessing = false }
        
        // Step 1: ML Kit Detection
        let visionImage = VisionImage(image: image)
        visionImage.orientation = image.imageOrientation
        
        do {
            let labels = try await imageLabeler.process(visionImage)
            
            // Step 2: Enhanced Food Filtering
            let foodDetections = analyzeFoodLabels(labels)
            
            if let bestDetection = foodDetections.first {
                // Step 3: Search in databases
                if let food = await searchForFood(bestDetection) {
                    return DetectedFood(
                        food: food,
                        confidence: bestDetection.confidence,
                        boundingBox: nil,
                        alternativeSuggestions: await getAlternativeSuggestions(for: bestDetection.label)
                    )
                }
            }
            
            // Step 4: Fallback to time-based suggestions
            return await getTimeBasedSuggestion()
            
        } catch {
            print("ML Kit detection error: \(error)")
            return await getTimeBasedSuggestion()
        }
    }
    
    // Analyze ML Kit labels with enhanced food detection
    private func analyzeFoodLabels(_ labels: [ImageLabel]) -> [(label: String, confidence: Float)] {
        var foodDetections: [(label: String, confidence: Float)] = []
        
        for label in labels {
            let labelText = label.text.lowercased()
            
            // Check if it's directly a food item
            if isFoodItem(labelText) {
                foodDetections.append((label: labelText, confidence: label.confidence))
                continue
            }
            
            // Check food categories
            for (category, keywords) in foodCategories {
                if keywords.contains(where: { labelText.contains($0) }) {
                    // Try to find a more specific food match
                    let specificFood = refineToSpecificFood(labelText, category: category)
                    foodDetections.append((label: specificFood, confidence: label.confidence * 0.9))
                }
            }
            
            // Check for meal-related terms
            if labelText.contains("meal") || labelText.contains("dish") || labelText.contains("plate") {
                // Use context to guess the food
                let contextualFood = guessFromContext(labels: labels)
                if !contextualFood.isEmpty {
                    foodDetections.append((label: contextualFood, confidence: label.confidence * 0.7))
                }
            }
        }
        
        // Sort by confidence
        return foodDetections.sorted { $0.confidence > $1.confidence }
    }
    
    // Check if a label is likely a food item
    private func isFoodItem(_ text: String) -> Bool {
        // Check all food categories
        for (_, keywords) in foodCategories {
            if keywords.contains(where: { text.contains($0) }) {
                return true
            }
        }
        
        // Check GCC foods
        let gccFoodNames = GCCFoodDatabase.commonFoods.map { $0.name.lowercased() }
        return gccFoodNames.contains(where: { 
            fuzzyMatch(text, with: $0) > 0.7
        })
    }
    
    // Refine generic labels to specific foods
    private func refineToSpecificFood(_ label: String, category: String) -> String {
        let refinements: [String: [String: String]] = [
            "breakfast": [
                "egg": "scrambled eggs",
                "bread": "toast with butter",
                "cereal": "cereal with milk",
                "coffee": "coffee with milk"
            ],
            "lunch": [
                "sandwich": "chicken sandwich",
                "burger": "beef burger with fries",
                "salad": "caesar salad",
                "pasta": "spaghetti bolognese"
            ],
            "dinner": [
                "meat": "grilled chicken breast",
                "fish": "grilled salmon",
                "rice": "steamed white rice",
                "vegetables": "mixed vegetables"
            ],
            "arabic": [
                "bread": "pita bread",
                "meat": "shawarma",
                "rice": "kabsa rice",
                "salad": "fattoush salad",
                "soup": "lentil soup",
                "dessert": "kunafa",
                "pastry": "fatayer",
                "dip": "hummus",
                "bean": "foul medames",
                "stew": "bamia",
                "chicken": "chicken mandi",
                "lamb": "lamb ouzi"
            ]
        ]
        
        for (key, value) in refinements[category] ?? [:] {
            if label.contains(key) {
                return value
            }
        }
        
        return label
    }
    
    // Guess food from context of other labels
    private func guessFromContext(labels: [ImageLabel]) -> String {
        let labelTexts = labels.map { $0.text.lowercased() }
        
        // Common combinations
        if labelTexts.contains(where: { $0.contains("coffee") }) && 
           labelTexts.contains(where: { $0.contains("cup") }) {
            return "coffee"
        }
        
        if labelTexts.contains(where: { $0.contains("plate") }) {
            let hour = Calendar.current.component(.hour, from: Date())
            switch hour {
            case 6..<11: return "breakfast plate"
            case 11..<15: return "lunch plate"
            default: return "dinner plate"
            }
        }
        
        return ""
    }
    
    // Search for food in databases
    private func searchForFood(_ detection: (label: String, confidence: Float)) async -> SimpleFood? {
        // First try local GCC database with fuzzy matching
        let localResults = searchLocalWithFuzzy(detection.label)
        if let bestLocal = localResults.first {
            var food = bestLocal
            food.confidence = detection.confidence
            return food
        }
        
        // Then try USDA
        await foodSearch.searchFood(query: detection.label)
        if let usdaResult = foodSearch.searchResults.first {
            var food = usdaResult
            food.confidence = detection.confidence
            return food
        }
        
        return nil
    }
    
    // Fuzzy search in local database
    private func searchLocalWithFuzzy(_ query: String) -> [SimpleFood] {
        let lowercasedQuery = query.lowercased()
        
        return GCCFoodDatabase.commonFoods
            .map { food in
                (food: food, score: fuzzyMatch(lowercasedQuery, with: food.name.lowercased()))
            }
            .filter { $0.score > 0.6 }
            .sorted { $0.score > $1.score }
            .map { $0.food }
    }
    
    // Fuzzy matching algorithm
    private func fuzzyMatch(_ str1: String, with str2: String) -> Double {
        // Simple fuzzy matching based on common characters
        let set1 = Set(str1)
        let set2 = Set(str2)
        let intersection = set1.intersection(set2)
        let union = set1.union(set2)
        
        guard !union.isEmpty else { return 0 }
        
        // Jaccard similarity
        let jaccard = Double(intersection.count) / Double(union.count)
        
        // Bonus for substring match
        let substringBonus: Double = str2.contains(str1) || str1.contains(str2) ? 0.3 : 0
        
        return min(jaccard + substringBonus, 1.0)
    }
    
    // Get alternative suggestions
    private func getAlternativeSuggestions(for query: String) async -> [SimpleFood] {
        // Get top 3 fuzzy matches from local database
        let localMatches = searchLocalWithFuzzy(query).prefix(3)
        
        // Get time-based suggestions
        let timeBasedSuggestions = getTimeBasedFoodSuggestions().prefix(2)
        
        // Combine and deduplicate
        var suggestions = Array(localMatches) + timeBasedSuggestions
        suggestions = Array(Set(suggestions)).prefix(5).map { $0 }
        
        return suggestions
    }
    
    // Get time-based suggestion when detection fails
    private func getTimeBasedSuggestion() async -> DetectedFood? {
        let suggestions = getTimeBasedFoodSuggestions()
        
        guard let firstSuggestion = suggestions.first else { return nil }
        
        return DetectedFood(
            food: firstSuggestion,
            confidence: 0.5,
            boundingBox: nil,
            alternativeSuggestions: Array(suggestions.dropFirst().prefix(4))
        )
    }
    
    // Get food suggestions based on time of day
    private func getTimeBasedFoodSuggestions() -> [SimpleFood] {
        let hour = Calendar.current.component(.hour, from: Date())
        
        switch hour {
        case 6..<11:
            // Breakfast time
            return GCCFoodDatabase.commonFoods.filter { food in
                ["foul", "hummus", "labneh", "zaatar", "fatayer", "shakshuka", "eggs", "toast", "coffee"].contains(where: { 
                    food.name.lowercased().contains($0)
                })
            }
        case 11..<15:
            // Lunch time
            return GCCFoodDatabase.commonFoods.filter { food in
                ["shawarma", "kebab", "biryani", "machboos", "sandwich", "burger", "salad"].contains(where: { 
                    food.name.lowercased().contains($0)
                })
            }
        case 15..<17:
            // Snack time
            return GCCFoodDatabase.commonFoods.filter { food in
                ["dates", "coffee", "tea", "juice", "sambousek", "fatayer"].contains(where: { 
                    food.name.lowercased().contains($0)
                })
            }
        default:
            // Dinner time
            return GCCFoodDatabase.commonFoods.filter { food in
                ["mandi", "kabsa", "grilled", "curry", "biryani", "steak", "fish"].contains(where: { 
                    food.name.lowercased().contains($0)
                })
            }
        }
    }
}

// Detected Food Model
struct DetectedFood {
    let food: SimpleFood
    let confidence: Float
    let boundingBox: CGRect?
    let alternativeSuggestions: [SimpleFood]
}

// Enhanced data manager with UserDefaults persistence and CloudKit sync
@MainActor
class MealDataManager: ObservableObject {
    @Published var todaysMeals: [SimpleMeal] = []
    @Published var totalCalories: Int = 0
    
    // Smart connection properties
    @Published var lastLoggedMeal: SimpleMeal?
    @Published var shouldCelebrate: Bool = false
    @Published var celebrationMessage: String = ""
    
    var onMealLogged: ((SimpleMeal, String) -> Void)?
    
    private let userDefaults = UserDefaults.standard
    private let mealsKey = "todaysMeals"
    private let dateKey = "lastSavedDate"
    private let cloudKit = CloudKitManager.shared
    
    init() {
        loadTodaysMeals()
        Task {
            await syncWithCloud()
        }
    }
    
    func loadTodaysMeals() {
        // Check if we need to clear old data
        if let lastSavedDate = userDefaults.object(forKey: dateKey) as? Date {
            if !Calendar.current.isDateInToday(lastSavedDate) {
                // Clear old meals if not from today
                todaysMeals = []
                saveMeals()
                return
            }
        }
        
        // Load saved meals
        if let data = userDefaults.data(forKey: mealsKey),
           let decoded = try? JSONDecoder().decode([SimpleMeal].self, from: data) {
            todaysMeals = decoded
        }
        
        updateTotalCalories()
    }
    
    func addMeal(name: String, calories: Int, protein: Double = 0, carbs: Double = 0, fat: Double = 0, source: String = "") {
        let time = Date().formatted(date: .omitted, time: .shortened)
        let meal = SimpleMeal(
            name: name,
            calories: calories,
            time: time,
            protein: protein,
            carbs: carbs,
            fat: fat
        )
        todaysMeals.append(meal)
        lastLoggedMeal = meal
        updateTotalCalories()
        saveMeals()
        
        // Sync with HealthKit
        Task {
            await HealthKitManager.shared.saveMealNutrition(meal: meal)
        }
        
        // Sync with CloudKit
        Task {
            do {
                try await cloudKit.saveMealToCloud(meal)
            } catch {
                print("Failed to sync meal to cloud: \(error)")
            }
        }
        
        // Trigger smart connections
        onMealLogged?(meal, source)
        checkForCelebrations()
        MealNotificationManager.shared.scheduleReflection(for: meal)
    }
    
    private func checkForCelebrations() {
        // Simple celebration logic - can be expanded
        if todaysMeals.count == 1 {
            triggerCelebration("🎉 First meal logged today!")
        } else if todaysMeals.count == 3 {
            triggerCelebration("🔥 Three meals tracked - great consistency!")
        } else if totalCalories >= 500 && totalCalories <= 600 {
            triggerCelebration("💪 Halfway to your goal!")
        }
    }
    
    private func triggerCelebration(_ message: String) {
        celebrationMessage = message
        shouldCelebrate = true
        
        // Auto-dismiss celebration after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.shouldCelebrate = false
        }
    }
    
    private func saveMeals() {
        if let encoded = try? JSONEncoder().encode(todaysMeals) {
            userDefaults.set(encoded, forKey: mealsKey)
            userDefaults.set(Date(), forKey: dateKey)
        }
    }
    
    private func updateTotalCalories() {
        totalCalories = todaysMeals.reduce(0) { $0 + $1.calories }
    }
    
    // CloudKit sync methods
    @MainActor
    func syncWithCloud() async {
        guard cloudKit.isAvailable else { return }
        
        do {
            // Fetch meals from CloudKit
            let cloudMeals = try await cloudKit.fetchMealsFromCloud()
            
            // Merge cloud meals with local meals (avoiding duplicates)
            for cloudMeal in cloudMeals {
                if !todaysMeals.contains(where: { $0.id == cloudMeal.id }) {
                    // Only add today's meals
                    let mealDate = parseMealDate(from: cloudMeal.time)
                    if Calendar.current.isDateInToday(mealDate) {
                        todaysMeals.append(cloudMeal)
                    }
                }
            }
            
            updateTotalCalories()
            saveMeals()
        } catch {
            print("Failed to sync with cloud: \(error)")
        }
    }
    
    func deleteMeal(_ meal: SimpleMeal) {
        todaysMeals.removeAll { $0.id == meal.id }
        updateTotalCalories()
        saveMeals()
        
        // Delete from CloudKit
        Task {
            do {
                try await cloudKit.deleteMealFromCloud(meal.id)
            } catch {
                print("Failed to delete meal from cloud: \(error)")
            }
        }
    }
    
    private func parseMealDate(from timeString: String) -> Date {
        // Parse the time string to get today's date with that time
        // For simplicity, assuming meals are from today
        return Date()
    }
}

struct SimpleMeal: Identifiable, Codable {
    let id: UUID
    let name: String
    let calories: Int
    let time: String
    var protein: Double = 0
    var carbs: Double = 0
    var fat: Double = 0
    
    init(id: UUID = UUID(), name: String, calories: Int, time: String, protein: Double = 0, carbs: Double = 0, fat: Double = 0) {
        self.id = id
        self.name = name
        self.calories = calories
        self.time = time
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }
}

// User Profile Manager
class UserProfileManager: ObservableObject {
    @Published var userName: String = ""
    @Published var calorieGoal: Int = 2000
    @Published var proteinGoal: Double = 50
    @Published var carbsGoal: Double = 250
    @Published var fatGoal: Double = 65
    @Published var weight: Double = 70
    @Published var height: Double = 170
    @Published var age: Int = 25
    @Published var gender: String = "Other"
    @Published var activityLevel: String = "Moderate"
    @Published var preferLocalFood: Bool = true  // Default to GCC foods
    @Published var location: String = "Dubai"     // User location
    
    private let userDefaults = UserDefaults.standard
    
    init() {
        loadProfile()
    }
    
    func loadProfile() {
        userName = userDefaults.string(forKey: "userName") ?? ""
        calorieGoal = userDefaults.integer(forKey: "calorieGoal")
        if calorieGoal == 0 { calorieGoal = 2000 }
        proteinGoal = userDefaults.double(forKey: "proteinGoal")
        if proteinGoal == 0 { proteinGoal = 50 }
        carbsGoal = userDefaults.double(forKey: "carbsGoal")
        if carbsGoal == 0 { carbsGoal = 250 }
        fatGoal = userDefaults.double(forKey: "fatGoal")
        if fatGoal == 0 { fatGoal = 65 }
        weight = userDefaults.double(forKey: "weight")
        if weight == 0 { weight = 70 }
        height = userDefaults.double(forKey: "height")
        if height == 0 { height = 170 }
        age = userDefaults.integer(forKey: "age")
        if age == 0 { age = 25 }
        gender = userDefaults.string(forKey: "gender") ?? "Other"
        activityLevel = userDefaults.string(forKey: "activityLevel") ?? "Moderate"
        preferLocalFood = userDefaults.bool(forKey: "preferLocalFood")
        if !userDefaults.bool(forKey: "hasSetFoodPreference") {
            preferLocalFood = true  // Default to true for new users
            userDefaults.set(true, forKey: "hasSetFoodPreference")
        }
        location = userDefaults.string(forKey: "location") ?? "Dubai"
    }
    
    func saveProfile() {
        userDefaults.set(userName, forKey: "userName")
        userDefaults.set(calorieGoal, forKey: "calorieGoal")
        userDefaults.set(proteinGoal, forKey: "proteinGoal")
        userDefaults.set(carbsGoal, forKey: "carbsGoal")
        userDefaults.set(fatGoal, forKey: "fatGoal")
        userDefaults.set(weight, forKey: "weight")
        userDefaults.set(height, forKey: "height")
        userDefaults.set(age, forKey: "age")
        userDefaults.set(gender, forKey: "gender")
        userDefaults.set(activityLevel, forKey: "activityLevel")
        userDefaults.set(preferLocalFood, forKey: "preferLocalFood")
        userDefaults.set(location, forKey: "location")
    }
}

// MARK: - Premium Feature Enum
enum PremiumFeature: String {
    case basicFoodScanning = "Basic Food Scanning"
    case advancedFoodScanning = "Advanced Food Scanning"
    case manualEntry = "Manual Entry"
    case basicHistory = "7-Day History"
    case unlimitedHistory = "Unlimited History"
    case nutritionInsights = "Nutrition Insights"
    case mealPlanning = "Meal Planning"
    case exportData = "Export Data"
    case customGoals = "Custom Goals"
    case weeklyReports = "Weekly Reports"
    case aiNutritionCoach = "AI Nutrition Coach"
    case advancedAnalytics = "Advanced Analytics"
    case prioritySupport = "Priority Support"
    case betaFeatures = "Beta Features"
    case familySharing = "Family Sharing"
}

// MARK: - Multi Food Scanner Placeholder
struct MultiFoodScannerView: View {
    let onComplete: (MealComposition) -> Void
    
    var body: some View {
        VStack {
            Text("Multi-Food Scanner")
                .font(.title)
            Text("This feature is coming soon!")
                .padding()
            Button("Close") {
                // Create dummy composition for now
                let composition = MealComposition(items: [])
                onComplete(composition)
            }
            .padding()
        }
    }
}

struct MealComposition {
    let items: [FoodItem]
}

struct FoodItem {
    let name: String
    let calories: Int
    let nutritionInfo: NutritionInfo?
    let quantity: Double
}

struct NutritionInfo {
    let protein: Double
    let carbs: Double
    let fat: Double
}

// MARK: - Subscription Manager (Temporary)
class SubscriptionManager: ObservableObject {
    static let shared = SubscriptionManager()
    
    @Published var currentTier: String = "free"
    @Published var isProcessingPurchase = false
    
    enum SubscriptionTier: String {
        case free = "Free"
        case premium = "Premium"
        case pro = "Pro"
    }
    
    func hasAccess(to feature: PremiumFeature) -> Bool {
        // Simplified logic - in production would check actual subscription status
        switch currentTier {
        case "free":
            // Free tier features
            return [.basicFoodScanning, .manualEntry, .basicHistory].contains(feature)
        case "premium":
            // Premium tier features
            return ![.aiNutritionCoach, .advancedAnalytics, .prioritySupport, .betaFeatures, .familySharing].contains(feature)
        case "pro":
            // Pro tier - all features
            return true
        default:
            return false
        }
    }
    
    func requestFeatureAccess(_ feature: PremiumFeature) {
        if !hasAccess(to: feature) {
            showPaywall()
        }
    }
    
    func showPaywall() {
        print("Showing subscription paywall")
    }
    
    func updateSubscriptionStatus() async {
        // In production, would check StoreKit for active subscriptions
        // For now, just a placeholder
        print("Updating subscription status")
    }
}

struct ContentView: View {
    @State private var selectedTab = 0 // Start on Coach
    @StateObject private var dataManager = MealDataManager()
    @StateObject private var profileManager = UserProfileManager()
    @StateObject private var healthKit = HealthKitManager.shared
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @EnvironmentObject private var appSettings: AppSettingsManager
    @State private var showingOnboarding = false
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var showingCamera = false
    @State private var showingVoiceCapture = false
    @State private var showingManualEntry = false
    @StateObject private var localization = LocalizationManager.shared
    
    // Smart connection states
    @State private var showMealLoggedCelebration = false
    @State private var lastLoggedMeal: String = ""
    @State private var shouldSwitchToDashboard = false
    
    var body: some View {
        ZStack {
            // Clean background
            Color.calBackground
                .ignoresSafeArea()
            
            TabView(selection: $selectedTab) {
                NavigationView {
                    CoachHomeView()
                        .environmentObject(dataManager)
                        .environmentObject(profileManager)
                        .environmentObject(appSettings)
                        .navigationBarHidden(true)
                }
                .tabItem {
                    Label(localization.localized("Coach"), systemImage: "brain.head.profile")
                }
                .tag(0)
                
                NavigationView {
                    CalDashboardView(
                        openScanner: { showingCamera = true },
                        openManualEntry: { showingManualEntry = true },
                        openVoiceCapture: { showingVoiceCapture = true }
                    )
                    .environmentObject(dataManager)
                    .environmentObject(profileManager)
                    .navigationBarHidden(true)
                }
                .tabItem {
                    Label(localization.localized("Home"), systemImage: "house.fill")
                }
                .tag(1)
                
                NavigationView {
                    ServicesHubView()
                        .navigationBarHidden(true)
                }
                .tabItem {
                    Label(localization.localized("Services"), systemImage: "square.grid.2x2")
                }
                .tag(2)
                
                NavigationView {
                    CommunityHubView(localization: localization)
                        .navigationBarHidden(true)
                }
                .tabItem {
                    Label(localization.localized("Community"), systemImage: "calendar.badge.plus")
                }
                .tag(3)
                
                NavigationView {
                    CalProfileView()
                        .environmentObject(profileManager)
                        .environmentObject(dataManager)
                        .navigationBarHidden(true)
                }
                .tabItem {
                    Label(localization.localized("Profile"), systemImage: "person.fill")
                }
                .tag(4)
            }
            .onAppear {
                // Configure modern tab bar
                let appearance = UITabBarAppearance()
                appearance.configureWithOpaqueBackground()
                appearance.backgroundColor = UIColor.white
                appearance.shadowColor = UIColor.black.withAlphaComponent(0.1)
                
                // Configure tab items
                appearance.stackedLayoutAppearance.selected.iconColor = UIColor(Color.calPrimary)
                appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                    .foregroundColor: UIColor(Color.calPrimary),
                    .font: UIFont.systemFont(ofSize: 10, weight: .medium)
                ]
                appearance.stackedLayoutAppearance.normal.iconColor = UIColor(Color.calTextSecondary)
                appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                    .foregroundColor: UIColor(Color.calTextSecondary),
                    .font: UIFont.systemFont(ofSize: 10, weight: .regular)
                ]
                
                UITabBar.appearance().standardAppearance = appearance
                UITabBar.appearance().scrollEdgeAppearance = appearance
                
                // Configure navigation bar
                let navAppearance = UINavigationBarAppearance()
                navAppearance.configureWithOpaqueBackground()
                navAppearance.backgroundColor = UIColor(Color.calBackground)
                navAppearance.shadowColor = .clear
                UINavigationBar.appearance().standardAppearance = navAppearance
                UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
            }
            .accentColor(.calPrimary)
            .fullScreenCover(isPresented: $showingOnboarding) {
                CalOnboardingView(profileManager: profileManager) {
                    hasCompletedOnboarding = true
                    showingOnboarding = false
                }
            }
            .fullScreenCover(isPresented: $showingCamera) {
                CalCameraView(dataManager: dataManager)
            }
            .sheet(isPresented: .constant(false)) {
                Text("PaywallView not implemented")
            }
            .sheet(isPresented: $showingVoiceCapture) {
                NavigationView {
                    SimpleVoiceView()
                        .environmentObject(dataManager)
                        .navigationBarHidden(true)
                }
            }
            .sheet(isPresented: $showingManualEntry) {
                ManualMealEntrySheet { name, calories in
                    dataManager.addMeal(name: name, calories: Int(calories.rounded()))
                    showingManualEntry = false
                }
            }
            .overlay(
                // Success animation overlay
                Group {
                    if dataManager.shouldCelebrate {
                        CalSuccessView(message: dataManager.celebrationMessage)
                            .transition(AnyTransition.scale.combined(with: .opacity))
                            .animation(Animation.spring(response: 0.6, dampingFraction: 0.7), value: dataManager.shouldCelebrate)
                    }
                }
            )
            .onAppear {
                setupSmartConnections()
                
                // Sync food search preference
                SimpleFoodSearchService.shared.useLocalDatabase = profileManager.preferLocalFood
                
                if !hasCompletedOnboarding {
                    showingOnboarding = true
                }
                
                // Initialize subscription status
                Task {
                    await subscriptionManager.updateSubscriptionStatus()
                }
            }
        }
        // .preferredColorScheme(.light) // Removed to support Dark Mode
    }
    
    private func setupSmartConnections() {
        // Set up cross-tab meal logging callback
        dataManager.onMealLogged = { meal, source in
            handleMealLogged(meal: meal, source: source)
        }
    }
    
private func handleMealLogged(meal: SimpleMeal, source: String) {
        lastLoggedMeal = meal.name
        
        // Auto-switch to Dashboard after meal logging from Scanner or Voice
        if source == "Scanner" || source == "Voice" {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation(.easeInOut(duration: 0.5)) {
                    selectedTab = 1 // Dashboard tab
                }
            }
        }
    }
}

struct CalSuccessView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 40))
                .foregroundColor(.calPrimary)
            Text(message)
                .font(.headline)
                .multilineTextAlignment(.center)
            Text("Logged successfully")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(24)
        .background(.thinMaterial)
        .cornerRadius(20)
        .shadow(radius: 20)
    }
}

// MARK: - SCAL Dashboard View
struct CalDashboardView: View {
    @EnvironmentObject var dataManager: MealDataManager
    @EnvironmentObject var profileManager: UserProfileManager
    @EnvironmentObject var appSettings: AppSettingsManager
    @EnvironmentObject var notificationManager: MealNotificationManager
    @StateObject private var healthKit = HealthKitManager.shared
    @StateObject private var localization = LocalizationManager.shared
    @State private var showingDatePicker = false
    @State private var selectedDate = Date()
    var openScanner: () -> Void = {}
    var openManualEntry: () -> Void = {}
    var openVoiceCapture: () -> Void = {}
    
    var totalCalories: Int {
        dataManager.totalCalories
    }
    
    var totalProtein: Double {
        dataManager.todaysMeals.reduce(0) { $0 + $1.protein }
    }
    
    var totalCarbs: Double {
        dataManager.todaysMeals.reduce(0) { $0 + $1.carbs }
    }
    
    var totalFat: Double {
        dataManager.todaysMeals.reduce(0) { $0 + $1.fat }
    }
    
    var adjustedCalorieGoal: Int {
        // Add workout calories to daily goal
        profileManager.calorieGoal + healthKit.todaysWorkoutCalories
    }
    
    var remainingCalories: Int {
        adjustedCalorieGoal - totalCalories
    }
    
    var calorieProgress: Double {
        min(1.0, Double(totalCalories) / Double(adjustedCalorieGoal))
    }
    
    var notificationsEnabled: Bool {
        notificationManager.authorizationStatus == .authorized
    }
    
    var notificationStatusText: String {
        switch notificationManager.authorizationStatus {
        case .authorized: return "Enabled"
        case .denied: return "Denied - enable in Settings"
        case .notDetermined: return "Not requested"
        default: return "Unavailable"
        }
    }
    
    var hydrationSummary: String {
        guard notificationsEnabled else {
            return "Enable notifications to receive reminders"
        }
        guard let reminder = nextHydrationReminder else {
            return "No reminders scheduled"
        }
        return "Next at \(timeString(for: reminder))"
    }
    
    var fastingSummary: String {
        guard appSettings.fastingRemindersEnabled else { return "Off" }
        return "Suhoor \(timeString(for: appSettings.suhoorReminder)) • Iftar \(timeString(for: appSettings.iftarReminder))"
    }
    
    var localPreferenceSummary: String {
        appSettings.preferLocalFoods ? "Prioritizing GCC foods" : "USDA defaults"
    }
    
    private var nextHydrationReminder: DailyReminder? {
        let sorted = appSettings.hydrationReminders.sorted { lhs, rhs in
            if lhs.hour == rhs.hour {
                return lhs.minute < rhs.minute
            }
            return lhs.hour < rhs.hour
        }
        guard !sorted.isEmpty else { return nil }
        let now = Calendar.current.dateComponents([.hour, .minute], from: Date())
        let hour = now.hour ?? 0
        let minute = now.minute ?? 0
        return sorted.first(where: { reminder in
            (reminder.hour > hour) || (reminder.hour == hour && reminder.minute > minute)
        }) ?? sorted.first
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Navigation bar
                CalNavigationBar(
                    title: localization.localized("Today's Progress"),
                    rightButton: AnyView(
                        HStack(spacing: 16) {
                            // Sync button
                            Button(action: {
                                Task {
                                    await dataManager.syncWithCloud()
                                }
                            }) {
                                Image(systemName: CloudKitManager.shared.isSyncing ? "arrow.triangle.2.circlepath" : "icloud.and.arrow.down")
                                    .font(.system(size: 20))
                                    .foregroundColor(.calTextPrimary)
                                    .rotationEffect(Angle(degrees: CloudKitManager.shared.isSyncing ? 360 : 0))
                                    .animation(CloudKitManager.shared.isSyncing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: CloudKitManager.shared.isSyncing)
                            }
                            .disabled(CloudKitManager.shared.isSyncing || !CloudKitManager.shared.isAvailable)
                            
                            // Calendar button
                            Button(action: { showingDatePicker.toggle() }) {
                                Image(systemName: "calendar")
                                    .font(.system(size: 22))
                                    .foregroundColor(.calTextPrimary)
                            }
                        }
                    )
                )
                
                VStack(spacing: 24) {
                    quickActionsCard
                    dailyOverviewSection
                    wellnessSection
                    mealsSection
                }
                .padding(.horizontal)
                .padding(.bottom, 100)
            }
        }
        .background(Color.calBackground)
        .sheet(isPresented: $showingDatePicker) {
            CalDatePicker(selectedDate: $selectedDate)
        }
    }
    
    private var mainCalorieCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Calories")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.calTextSecondary)
                    
                    HStack(alignment: .bottom, spacing: 4) {
                        Text("\(totalCalories)")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundColor(.calTextPrimary)
                        Text("/ \(adjustedCalorieGoal)")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.calTextSecondary)
                            .padding(.bottom, 4)
                    }
                    
                    HStack(spacing: 8) {
                        Text("\(remainingCalories) remaining")
                            .font(.system(size: 14))
                            .foregroundColor(remainingCalories > 0 ? .calPrimary : .red)
                        
                        if healthKit.todaysWorkoutCalories > 0 {
                            Text("(+\(healthKit.todaysWorkoutCalories) workout)")
                                .font(.system(size: 12))
                                .foregroundColor(.orange)
                        }
                    }
                }
                
                Spacer()
                
                CalProgressRing(
                    progress: calorieProgress,
                    lineWidth: 12,
                    size: 100,
                    primaryColor: .calPrimary,
                    backgroundColor: Color.calPrimary.opacity(0.1)
                )
                .overlay(
                    Text("\(Int(calorieProgress * 100))%")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.calTextPrimary)
                )
            }
            
            // Progress bar details
            HStack(spacing: 12) {
                ForEach(["Breakfast", "Lunch", "Dinner", "Snacks"], id: \.self) { meal in
                    VStack(spacing: 4) {
                        Circle()
                            .fill(mealTypeColor(meal))
                            .frame(width: 8, height: 8)
                        Text(meal)
                            .font(.system(size: 11))
                            .foregroundColor(.calTextSecondary)
                    }
                }
            }
        }
        .padding(20)
        .calCard()
    }
    
    private var macrosCard: some View {
        HStack(spacing: 12) {
            MacroCard(
                title: "Protein",
                value: Int(totalProtein),
                goal: Int(profileManager.proteinGoal),
                color: .red,
                unit: "g"
            )
            
            MacroCard(
                title: "Carbs",
                value: Int(totalCarbs),
                goal: Int(profileManager.carbsGoal),
                color: .orange,
                unit: "g"
            )
            
            MacroCard(
                title: "Fat",
                value: Int(totalFat),
                goal: Int(profileManager.fatGoal),
                color: .blue,
                unit: "g"
            )
        }
    }
    
    private var wellnessStatusCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            reminderStatusRow(
                icon: "bell.fill",
                title: "Hydration",
                detail: hydrationSummary,
                color: .calPrimary
            )
            reminderStatusRow(
                icon: "moon.stars.fill",
                title: "Fasting",
                detail: fastingSummary,
                color: appSettings.fastingRemindersEnabled ? .orange : .calTextSecondary
            )
            reminderStatusRow(
                icon: "globe",
                title: "Local Foods",
                detail: localPreferenceSummary,
                color: appSettings.preferLocalFoods ? .green : .calTextSecondary
            )
        }
        .padding(20)
        .calCard()
    }
    
    private var mealsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text(localization.localized("Recent Meals"))
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                Spacer()
                if CloudKitManager.shared.isSyncing {
                    ProgressView()
                        .scaleEffect(0.7)
                        .padding(.trailing, 8)
                }
                Text("\(dataManager.todaysMeals.count) items")
                    .font(.system(size: 14))
                    .foregroundColor(.calTextSecondary)
            }
            
            if dataManager.todaysMeals.isEmpty {
                EmptyMealsCard()
            } else {
                VStack(spacing: 12) {
                    ForEach(dataManager.todaysMeals) { meal in
                        CalMealRow(meal: meal)
                    }
                }
            }
        }
    }
    
    private var waterTrackingCard: some View {
        VStack(spacing: 16) {
            HStack {
                Text(localization.localized("Water"))
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                Spacer()
                Text(String(format: "%.1f / 2.0 L", healthKit.todaysWaterIntake))
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.blue)
            }
            
            // Water progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.blue.opacity(0.1))
                        .frame(height: 40)
                    
                    RoundedRectangle(cornerRadius: 8)
                        .fill(
                            LinearGradient(
                                colors: [Color.blue.opacity(0.6), Color.blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * min(1.0, healthKit.todaysWaterIntake / 2.0), height: 40)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: healthKit.todaysWaterIntake)
                    
                    // Water droplets
                    HStack(spacing: 0) {
                        ForEach(0..<8) { index in
                            Image(systemName: "drop.fill")
                                .font(.system(size: 16))
                                .foregroundColor(Double(index) < (healthKit.todaysWaterIntake * 4) ? .white : .blue.opacity(0.3))
                                .frame(width: geometry.size.width / 8)
                        }
                    }
                }
            }
            .frame(height: 40)
            
            // Quick add water buttons
            HStack(spacing: 12) {
                ForEach([0.25, 0.5, 0.75, 1.0], id: \.self) { amount in
                    Button(action: {
                        Task {
                            await healthKit.saveWaterIntake(liters: amount)
                            // Haptic feedback
                            let impact = UIImpactFeedbackGenerator(style: .light)
                            impact.impactOccurred()
                        }
                    }) {
                        Text("+\(String(format: "%.2g", amount))L")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.blue)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding(20)
        .calCard()
    }
    
    private var quickActionsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader("Quick Actions", subtitleKey: "Quick Actions Subtitle")
            quickActionsGrid
        }
        .padding(20)
        .calCard()
    }
    
    private var dailyOverviewSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader("Daily Snapshot", subtitleKey: "Daily Snapshot Subtitle")
            mainCalorieCard
            macrosCard
        }
    }
    
    private var wellnessSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader("Wellness & Reminders", subtitleKey: "Wellness Subtitle")
            Text(notificationStatusText)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(notificationsEnabled ? .green : .red)
            wellnessStatusCard
            if healthKit.isAuthorized {
                waterTrackingCard
            }
        }
    }
    
    private var quickActionsGrid: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                QuickAddButton(title: localization.localized("Scan"), icon: "camera.fill", color: .calPrimary) {
                    openScanner()
                }
                QuickAddButton(title: localization.localized("Manual"), icon: "square.and.pencil", color: .orange) {
                    openManualEntry()
                }
                QuickAddButton(title: localization.localized("Voice"), icon: "mic.fill", color: .purple) {
                    openVoiceCapture()
                }
            }
            
            HStack(spacing: 12) {
                QuickAddButton(title: localization.localized("Water +250ml"), icon: "drop.fill", color: .blue) {
                    Task { await healthKit.saveWaterIntake(liters: 0.25) }
                }
                QuickAddButton(title: localization.localized("Log Meal"), icon: "fork.knife", color: .pink) {
                    openManualEntry()
                }
                QuickAddButton(title: localization.localized("Record Weight"), icon: "scalemass.fill", color: .teal) {
                    // Placeholder for weight logging integration
                }
            }
        }
    }

    @ViewBuilder
    private func sectionHeader(_ titleKey: String, subtitleKey: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(localization.localized(titleKey))
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
            if let subtitleKey {
                Text(localization.localized(subtitleKey))
                    .font(.system(size: 13))
                    .foregroundColor(.calTextSecondary)
            }
        }
    }
    
    private func reminderStatusRow(icon: String, title: String, detail: String, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)
                .frame(width: 32, height: 32)
                .background(color.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.calTextPrimary)
                Text(detail)
                    .font(.system(size: 13))
                    .foregroundColor(.calTextSecondary)
            }
            Spacer()
        }
    }
    
    private func timeString(for reminder: DailyReminder) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: reminder.date)
    }
    
    private func mealTypeColor(_ type: String) -> Color {
        switch type {
        case "Breakfast": return .orange
        case "Lunch": return .blue
        case "Dinner": return .purple
        default: return .green
        }
    }
}

// MARK: - Services Hub
struct ServicesHubView: View {
    @StateObject private var localization = LocalizationManager.shared
    @State private var showingTelehealth = false
    @State private var showingEvents = false
    @State private var showingLoyalty = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(localization.localized("Services"))
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.calTextPrimary)
                    Text(localization.localized("Services Subtitle"))
                        .font(.system(size: 15))
                        .foregroundColor(.calTextSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                serviceCard(
                    icon: "stethoscope.circle.fill",
                    title: localization.localized("Telehealth"),
                    subtitle: localization.localized("Telehealth Subtitle"),
                    buttonTitle: localization.localized("Book Now")
                ) {
                    showingTelehealth = true
                }
                
                serviceCard(
                    icon: "figure.run.circle.fill",
                    title: localization.localized("Community Events"),
                    subtitle: localization.localized("Events Subtitle"),
                    buttonTitle: localization.localized("Explore")
                ) {
                    showingEvents = true
                }
                
                serviceCard(
                    icon: "gift.fill",
                    title: localization.localized("Loyalty & Rewards"),
                    subtitle: localization.localized("Loyalty Subtitle"),
                    buttonTitle: localization.localized("Open Dashboard")
                ) {
                    showingLoyalty = true
                }
            }
            .padding()
        }
        .sheet(isPresented: $showingTelehealth) {
            TelehealthSchedulerView()
        }
        .sheet(isPresented: $showingEvents) {
            EventBookingView()
        }
        .sheet(isPresented: $showingLoyalty) {
            LoyaltyDashboardView()
        }
    }
    
    private func serviceCard(icon: String, title: String, subtitle: String, buttonTitle: String, action: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .center, spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 36))
                    .foregroundColor(.calPrimary)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.calTextPrimary)
                    Text(subtitle)
                        .font(.system(size: 14))
                        .foregroundColor(.calTextSecondary)
                }
            }
            Button(action: action) {
                Text(buttonTitle)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.calPrimary)
                    .cornerRadius(12)
            }
        }
        .padding(20)
        .calCard()
    }
}

// Macro Card Component
struct MacroCard: View {
    let title: String
    let value: Int
    let goal: Int
    let color: Color
    let unit: String
    
    var progress: Double {
        goal > 0 ? Double(value) / Double(goal) : 0
    }
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)
                Text(title)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.calTextSecondary)
            }
            
            Text("\(value)\(unit)")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundColor(.calTextPrimary)
            
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(color.opacity(0.1))
                    .frame(height: 6)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(color)
                    .frame(width: max(0, CGFloat(progress) * 80), height: 6)
            }
            .frame(width: 80)
            
            Text("\(goal)\(unit)")
                .font(.system(size: 11))
                .foregroundColor(.calTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .calCard()
    }
}

// Empty Meals Card
struct EmptyMealsCard: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "camera.fill")
                .font(.system(size: 40))
                .foregroundColor(.calPrimary)
            
            Text("No meals logged yet")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.calTextPrimary)
            
            Text("Tap the + button to add your first meal")
                .font(.system(size: 14))
                .foregroundColor(.calTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(Color.calPrimary.opacity(0.05))
        .cornerRadius(16)
    }
}

// Meal Row Component
struct CalMealRow: View {
    let meal: SimpleMeal
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: mealIcon)
                .font(.system(size: 24))
                .foregroundColor(.calPrimary)
                .frame(width: 40, height: 40)
                .background(Color.calPrimary.opacity(0.1))
                .cornerRadius(12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(meal.name)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.calTextPrimary)
                
                HStack(spacing: 12) {
                    Text(meal.time)
                        .font(.system(size: 12))
                        .foregroundColor(.calTextSecondary)
                    
                    HStack(spacing: 8) {
                        MacroLabel(value: Int(meal.protein), unit: "g", label: "P", color: .red)
                        MacroLabel(value: Int(meal.carbs), unit: "g", label: "C", color: .orange)
                        MacroLabel(value: Int(meal.fat), unit: "g", label: "F", color: .blue)
                    }
                }
            }
            
            Spacer()
            
            Text("\(meal.calories) cal")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.calPrimary)
        }
        .padding(16)
        .calCard()
    }
    
    private var mealIcon: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 11 { return "sunrise.fill" }
        else if hour < 15 { return "sun.max.fill" }
        else if hour < 20 { return "sunset.fill" }
        else { return "moon.fill" }
    }
}

// Macro Label Component
struct MacroLabel: View {
    let value: Int
    let unit: String
    let label: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 2) {
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(color)
            Text("\(value)")
                .font(.system(size: 11))
                .foregroundColor(.calTextSecondary)
        }
    }
}

// Quick Add Button
struct QuickAddButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
                
                Text(title)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.calTextPrimary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(color.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

// Simple Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    let sourceType: UIImagePickerController.SourceType
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}

// MARK: - SCAL Camera View
struct CalCameraView: View {
    let dataManager: MealDataManager
    @Environment(\.dismiss) var dismiss
    @State private var showingCamera = false
    @State private var capturedImage: UIImage?
    @State private var isProcessing = false
    @State private var showingResults = false
    @State private var detectedFood: SimpleFood?
    @State private var detectedFoodResult: DetectedFood?
    @State private var showingManualSearch = false
    @State private var showingMultiFoodScanner = false
    @State private var showingBarcodeScanner = false // NEW: Barcode scanner state
    @StateObject private var foodSearch = SimpleFoodSearchService.shared
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @StateObject private var foodDetection = FoodDetectionService.shared
    @StateObject private var localization = LocalizationManager.shared
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                if let image = capturedImage {
                    // Show captured image
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .ignoresSafeArea()
                        .overlay(
                            processingOverlay
                        )
                } else {
                    // Camera placeholder / instructions
                    VStack(spacing: 20) {
                        Spacer()
                        
                        Image(systemName: "camera.viewfinder")
                            .font(.system(size: 80))
                            .foregroundColor(.white)

                        Text(localization.localized("Take a photo of your meal"))
                            .font(.system(size: 20, weight: .medium))
                            .foregroundColor(.white)

                        VStack(spacing: 16) {
                            Button(action: { showingCamera = true }) {
                                HStack {
                                    Image(systemName: "camera.fill")
                                    Text(localization.localized("Open Camera"))
                                }
                                .calPrimaryButton()
                            }

                            // NEW: Barcode Scanner Button
                            Button(action: { showingBarcodeScanner = true }) {
                                HStack {
                                    Image(systemName: "barcode.viewfinder")
                                    Text(localization.localized("Scan Barcode"))
                                }
                                .font(.headline)
                                .foregroundColor(.calPrimary)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.white)
                                .cornerRadius(12)
                            }
                        }
                        .padding(.horizontal, 40)
                        .padding(.bottom, 40)
                    }
                }
                
                // Navigation
                VStack {
                    HStack {
                        Button(action: { dismiss() }) {
                            Image(systemName: "xmark")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(Color.black.opacity(0.5))
                                .clipShape(Circle())
                        }
                        Spacer()
                    }
                    .padding()
                    
                    Spacer()
                    
                    // Bottom controls
                    if capturedImage != nil && !isProcessing {
                        HStack(spacing: 20) {
                            Button(action: {
                                capturedImage = nil
                                detectedFood = nil
                                showingCamera = true
                            }) {
                                HStack {
                                    Image(systemName: "arrow.counterclockwise")
                                    Text(localization.localized("Retake"))
                                }
                            }
                            .calSecondaryButton()
                            .background(Color.white)
                            .cornerRadius(20)
                            
                            Button("Manual Search") {
                                showingManualSearch = true
                            }
                            .calSecondaryButton()
                            .background(Color.white)
                            .cornerRadius(20)
                            
                            // Multi-food scanner button
                            Button(action: {
                                if subscriptionManager.hasAccess(to: .advancedFoodScanning) {
                                    showingMultiFoodScanner = true
                                } else {
                                    subscriptionManager.requestFeatureAccess(.advancedFoodScanning)
                                }
                            }) {
                                HStack {
                                    Image(systemName: "camera.metering.multispot")
                                    Text(localization.localized("Multi-Food"))
                                    if !subscriptionManager.hasAccess(to: .advancedFoodScanning) {
                                        Image(systemName: "lock.fill")
                                            .font(.caption2)
                                    }
                                }
                            }
                            .calSecondaryButton()
                            .background(Color.white)
                            .cornerRadius(20)
                        }
                        .padding()
                        .background(Color.black.opacity(0.7))
                    }
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingCamera) {
                ImagePicker(image: $capturedImage, sourceType: .camera)
                    .ignoresSafeArea()
            }
            .sheet(isPresented: $showingManualSearch) {
                CalFoodSearchView(onSelect: { food in
                    logFood(food)
                    showingManualSearch = false
                })
            }
            .sheet(isPresented: $showingResults) {
                if let result = detectedFoodResult {
                    CalFoodResultView(detectedFood: result, onConfirm: { selectedFood in
                        logFood(selectedFood)
                        dismiss()
                    }, onRetry: {
                        showingResults = false
                        capturedImage = nil
                        showingCamera = true
                    })
                }
            }
            .fullScreenCover(isPresented: $showingMultiFoodScanner) {
                MultiFoodScannerView { composition in
                    // For now, just close the scanner since it's a placeholder
                    showingMultiFoodScanner = false
                    dismiss()
                }
            }
            .fullScreenCover(isPresented: $showingBarcodeScanner) {
                BarcodeScannerView { barcode in
                    // Scan completed - search USDA by barcode
                    showingBarcodeScanner = false
                    Task {
                        await foodSearch.searchByBarcode(barcode)
                        // Show results after search completes
                        if let firstResult = foodSearch.searchResults.first {
                            logFood(firstResult)
                            dismiss()
                        }
                    }
                }
            }
            .onChange(of: capturedImage) { _, newImage in
                if newImage != nil {
                    analyzeFood()
                }
            }
        }
    }
    
    private var processingOverlay: some View {
        Group {
            if isProcessing {
                ZStack {
                    Color.black.opacity(0.7)
                    
                    VStack(spacing: 20) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(1.5)
                        
                        Text("Analyzing your meal...")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.white)
                    }
                }
                .ignoresSafeArea()
            }
        }
    }
    
    private func analyzeFood() {
        Task {
            guard let image = capturedImage else { return }
            
            await MainActor.run {
                isProcessing = true
            }
            
            // Use the enhanced food detection service
            if let result = await foodDetection.detectFood(from: image) {
                await MainActor.run {
                    detectedFoodResult = result
                    detectedFood = result.food
                    isProcessing = false
                    showingResults = true
                }
            } else {
                // No food detected, show manual search
                await MainActor.run {
                    isProcessing = false
                    showingManualSearch = true
                }
            }
        }
    }
    
    private func logFood(_ food: SimpleFood) {
        dataManager.addMeal(
            name: food.name,
            calories: Int(food.calories),
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            source: "Camera"
        )
    }
}

// MARK: - Community Hub Tab

struct CommunityHubView: View {
    let localization: LocalizationManager
    @StateObject private var communityVM = EventBookingViewModel()
    @State private var hasLoaded = false
    @State private var showEventsSheet = false
    @State private var showTelehealthSheet = false
    @State private var showLoyaltySheet = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text(localization.localized("Connected GCC experiences"))
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                
                eventsPreviewCard
                telehealthCard
                loyaltyCard
            }
            .padding()
        }
        .background(Color.calBackground.ignoresSafeArea())
        .task {
            guard !hasLoaded else { return }
            hasLoaded = true
            await communityVM.loadEvents()
        }
        .sheet(isPresented: $showEventsSheet) {
            NavigationView {
                EventBookingView()
                    .navigationTitle(localization.localized("Community Events"))
            }
        }
        .sheet(isPresented: $showTelehealthSheet) {
            TelehealthSchedulerView()
        }
        .sheet(isPresented: $showLoyaltySheet) {
            LoyaltyDashboardView()
        }
    }
    
    private var eventsPreviewCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(localization.localized("Upcoming Highlights"))
                    .font(.headline)
                Spacer()
                Button(localization.localized("View All")) {
                    showEventsSheet = true
                }
                .font(.caption)
            }
            if communityVM.events.isEmpty {
                ProgressView()
            } else {
                ForEach(communityVM.events.prefix(3)) { event in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(event.name)
                            .font(.subheadline.weight(.semibold))
                        Text(event.location)
                            .font(.caption)
                            .foregroundColor(.calTextSecondary)
                        Text(event.startDate, style: .date)
                            .font(.caption2)
                            .foregroundColor(.calTextSecondary)
                    }
                    .padding(.vertical, 6)
                    Divider()
                }
            }
        }
        .padding()
        .calCard()
    }
    
    private var telehealthCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(localization.localized("Telehealth Concierge"))
                .font(.headline)
            Text(localization.localized("Book Dubai-based nutritionists or doctors, synced with Supabase schedules."))
                .font(.subheadline)
                .foregroundColor(.calTextSecondary)
            Button(localization.localized("Schedule Consultation")) {
                showTelehealthSheet = true
            }
            .calPrimaryButton()
        }
        .padding()
        .calCard()
    }
    
    private var loyaltyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(localization.localized("Restaurant Rewards"))
                .font(.headline)
            Text(localization.localized("Track Enso, DIP DASH, and Poke & Co loyalty points and order directly via Supabase loyalty tables."))
                .font(.subheadline)
                .foregroundColor(.calTextSecondary)
            Button(localization.localized("Open Loyalty Hub")) {
                showLoyaltySheet = true
            }
            .calSecondaryButton()
        }
        .padding()
        .calCard()
    }
}

// Food Result View
struct CalFoodResultView: View {
    let detectedFood: DetectedFood
    let onConfirm: (SimpleFood) -> Void
    let onRetry: () -> Void
    
    @State private var selectedFood: SimpleFood
    
    init(detectedFood: DetectedFood, onConfirm: @escaping (SimpleFood) -> Void, onRetry: @escaping () -> Void) {
        self.detectedFood = detectedFood
        self.onConfirm = onConfirm
        self.onRetry = onRetry
        self._selectedFood = State(initialValue: detectedFood.food)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            headerView
            
            ScrollView {
                VStack(spacing: 24) {
                    foodInfoSection
                    nutritionSection
                    if !detectedFood.alternativeSuggestions.isEmpty {
                        alternativeSuggestionsSection
                    }
                    confirmButton
                }
            }
            .background(Color.calBackground)
        }
    }
    
    private var headerView: some View {
        HStack {
            Button("Retry") {
                onRetry()
            }
            .foregroundColor(.calPrimary)
            
            Spacer()
            
            Text("Food Detected")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.calTextPrimary)
            
            Spacer()
            
            Button("Retry") {
                onRetry()
            }
            .foregroundColor(.clear)
        }
        .padding()
        .background(Color.calBackground)
    }
    
    private var foodInfoSection: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.calPrimary)
            
            Text(selectedFood.name)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.calTextPrimary)
                .multilineTextAlignment(.center)
            
            if let brand = selectedFood.brand {
                Text(brand)
                    .font(.system(size: 16))
                    .foregroundColor(.calTextSecondary)
            }
            
            confidenceBadge
        }
        .padding(.top, 20)
    }
    
    private var confidenceBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "sparkles")
                .font(.system(size: 14))
                .foregroundColor(.calAccent)
            Text("AI Confidence: \(Int(detectedFood.confidence * 100))%")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.calAccent)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.calAccent.opacity(0.1))
        .cornerRadius(20)
    }
    
    private var nutritionSection: some View {
        VStack(spacing: 20) {
            CalorieDisplay(calories: Int(selectedFood.calories))
            
            HStack(spacing: 16) {
                NutrientBox(label: "Protein", value: Int(selectedFood.protein), unit: "g", color: .red)
                NutrientBox(label: "Carbs", value: Int(selectedFood.carbs), unit: "g", color: .orange)
                NutrientBox(label: "Fat", value: Int(selectedFood.fat), unit: "g", color: .blue)
            }
        }
        .padding(.horizontal)
    }
    
    private var alternativeSuggestionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Not what you're looking for?")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.calTextPrimary)
                .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(detectedFood.alternativeSuggestions) { alternative in
                        alternativeFoodButton(for: alternative)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.top, 20)
    }
    
    private func alternativeFoodButton(for food: SimpleFood) -> some View {
        Button(action: {
            selectedFood = food
        }) {
            VStack(spacing: 8) {
                Text(food.name)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.calTextPrimary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                
                Text("\(Int(food.calories)) cal")
                    .font(.system(size: 12))
                    .foregroundColor(.calTextSecondary)
            }
            .frame(width: 120, height: 80)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.calCardBg)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(selectedFood.id == food.id ? Color.calPrimary : Color.clear, lineWidth: 2)
                    )
            )
        }
    }
    
    private var confirmButton: some View {
        Button("Add to Today") {
            onConfirm(selectedFood)
        }
        .calPrimaryButton()
        .padding(.horizontal)
        .padding(.bottom, 40)
    }
}

// Calorie Display Component
struct CalorieDisplay: View {
    let calories: Int
    
    var body: some View {
        VStack(spacing: 8) {
            Text("\(calories)")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundColor(.calTextPrimary)
            Text("calories")
                .font(.system(size: 16))
                .foregroundColor(.calTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(Color.calPrimary.opacity(0.05))
        .cornerRadius(16)
    }
}

// Nutrient Box Component
struct NutrientBox: View {
    let label: String
    let value: Int
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.calTextSecondary)
            
            HStack(alignment: .bottom, spacing: 2) {
                Text("\(value)")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundColor(color)
                Text(unit)
                    .font(.system(size: 14))
                    .foregroundColor(color.opacity(0.7))
                    .padding(.bottom, 2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Simple Dashboard View (kept for reference)
struct SimpleDashboardView: View {
    @EnvironmentObject var dataManager: MealDataManager
    @EnvironmentObject var profileManager: UserProfileManager
    
    var totalCalories: Int {
        dataManager.totalCalories
    }
    
    var totalProtein: Double {
        dataManager.todaysMeals.reduce(0) { $0 + $1.protein }
    }
    
    var totalCarbs: Double {
        dataManager.todaysMeals.reduce(0) { $0 + $1.carbs }
    }
    
    var totalFat: Double {
        dataManager.todaysMeals.reduce(0) { $0 + $1.fat }
    }
    
    var remainingCalories: Int {
        profileManager.calorieGoal - totalCalories
    }
    
    var calorieProgress: Double {
        Double(totalCalories) / Double(profileManager.calorieGoal)
    }
    
    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Navigation title
                    Text("TODAY")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.calTextPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    // Date selector with glass effect
                    dateHeader
                    
                    // Calorie summary with glass effect
                    calorieSummaryCard
                    
                    // Macro breakdown with glass effect
                    macroBreakdownCard
                    
                    // Recent meals with glass effect
                    recentMealsSection
                    
                    // Quick stats with glass effect
                    quickStatsGrid
                }
                .padding()
            }
        }
    }
    
    private var dateHeader: some View {
        HStack {
            Image(systemName: "calendar")
                .foregroundColor(.white)
            Text("Today, \(Date().formatted(date: .abbreviated, time: .omitted))")
                .font(.headline)
                .foregroundColor(.white)
            Spacer()
        }
        .padding()
        .calCard()
    }
    
    private var calorieSummaryCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Calories")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("\(totalCalories) / \(profileManager.calorieGoal)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                Spacer()
                
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.2), lineWidth: 10)
                        .frame(width: 80, height: 80)
                    
                    Circle()
                        .trim(from: 0, to: calorieProgress)
                        .stroke(
                            LinearGradient(
                                colors: [Color.orange, Color.red],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 10, lineCap: .round)
                        )
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    
                    Text("\(Int(calorieProgress * 100))%")
                        .font(.headline)
                        .foregroundColor(.white)
                }
            }
            
            HStack {
                Label("\(remainingCalories) remaining", systemImage: "flame.fill")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.7))
                Spacer()
            }
        }
        .padding()
        .calCard()
    }
    
    private var macroBreakdownCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Macros")
                .font(.headline)
                .foregroundColor(.white)
            
            VStack(spacing: 12) {
                MacroProgressView(
                    current: totalProtein,
                    goal: profileManager.proteinGoal,
                    label: "Protein",
                    color: .red
                )
                
                MacroProgressView(
                    current: totalCarbs,
                    goal: profileManager.carbsGoal,
                    label: "Carbs",
                    color: .blue
                )
                
                MacroProgressView(
                    current: totalFat,
                    goal: profileManager.fatGoal,
                    label: "Fat",
                    color: .green
                )
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .calCard()
    }
    
    private var recentMealsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Meals")
                .font(.headline)
                .foregroundColor(.white)
            
            if dataManager.todaysMeals.isEmpty {
                Text("No meals logged yet")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.5))
                    .padding(.vertical, 20)
                    .frame(maxWidth: .infinity)
            } else {
                VStack(spacing: 10) {
                    ForEach(dataManager.todaysMeals) { meal in
                        MealRowWithMacros(
                            icon: mealIcon(for: meal.name),
                            meal: meal
                        )
                    }
                }
            }
        }
        .padding()
        .calCard()
    }
    
    private func mealIcon(for name: String) -> String {
        switch name.lowercased() {
        case "breakfast": return "sunrise.fill"
        case "lunch": return "sun.max.fill"
        case "dinner": return "moon.fill"
        case "snack": return "cup.and.saucer.fill"
        default: return "fork.knife"
        }
    }
    
    private var quickStatsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(title: "Day Streak", value: "7", icon: "flame.fill", color: .orange)
            StatCard(title: "Water (glasses)", value: "6", icon: "drop.fill", color: .blue)
            StatCard(title: "Steps", value: "8,432", icon: "figure.walk", color: .green)
            StatCard(title: "Sleep", value: "7.5h", icon: "bed.double.fill", color: .purple)
        }
    }
}

struct MacroProgressView: View {
    let current: Double
    let goal: Double
    let label: String
    let color: Color
    
    var progress: Double {
        goal > 0 ? current / goal : 0
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.7))
                Spacer()
                Text("\(Int(current))g / \(Int(goal))g")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 8)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [color, color.opacity(0.7)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: min(geometry.size.width * progress, geometry.size.width), height: 8)
                }
            }
            .frame(height: 8)
        }
    }
}

struct MealRowWithMacros: View {
    let icon: String
    let meal: SimpleMeal
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(.white)
                    .frame(width: 30)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(meal.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                    Text(meal.time)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
                
                Spacer()
                
                Text("\(meal.calories) cal")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.orange)
            }
            
            // Macro info
            HStack(spacing: 20) {
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 6, height: 6)
                    Text("\(Int(meal.protein))g")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.7))
                }
                
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 6, height: 6)
                    Text("\(Int(meal.carbs))g")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.7))
                }
                
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 6, height: 6)
                    Text("\(Int(meal.fat))g")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.7))
                }
                
                Spacer()
            }
            .padding(.leading, 40)
        }
        .padding(.vertical, 4)
    }
}

// StatCard removed - using SCAL version defined later

// MARK: - SCAL Progress View
struct CalProgressView: View {
    @EnvironmentObject var dataManager: MealDataManager
    @EnvironmentObject var profileManager: UserProfileManager
    @State private var selectedTimeframe = "Week"
    let timeframes = ["Week", "Month", "Year"]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Navigation bar
                CalNavigationBar(title: "Progress")
                
                VStack(spacing: 24) {
                    // Timeframe selector
                    HStack(spacing: 12) {
                        ForEach(timeframes, id: \.self) { timeframe in
                            Button(action: { selectedTimeframe = timeframe }) {
                                Text(timeframe)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(selectedTimeframe == timeframe ? .white : .calTextPrimary)
                                    .padding(.horizontal, 20)
                                    .padding(.vertical, 8)
                                    .background(
                                        selectedTimeframe == timeframe ? Color.calPrimary : Color.clear
                                    )
                                    .cornerRadius(20)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(Color.calPrimary, lineWidth: selectedTimeframe == timeframe ? 0 : 1)
                                    )
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // Weight progress card
                    weightProgressCard
                    
                    // Calorie trends
                    calorieTrendsCard
                    
                    // Achievement cards
                    achievementsSection
                }
                .padding(.bottom, 100)
            }
        }
        .background(Color.calBackground)
    }
    
    private var weightProgressCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Weight Progress")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Current")
                        .font(.system(size: 14))
                        .foregroundColor(.calTextSecondary)
                    Text("\(Int(profileManager.weight)) kg")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.calTextPrimary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 8) {
                    Text("Goal")
                        .font(.system(size: 14))
                        .foregroundColor(.calTextSecondary)
                    Text("65 kg")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.calPrimary)
                }
            }
            
            // Placeholder chart
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.calPrimary.opacity(0.1))
                .frame(height: 200)
                .overlay(
                    Text("Weight chart")
                        .foregroundColor(.calTextSecondary)
                )
        }
        .padding(20)
        .calCard()
        .padding(.horizontal)
    }
    
    private var calorieTrendsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Calorie Trends")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            // Average stats
            HStack(spacing: 20) {
                StatBox(label: "Avg Daily", value: "2,150", unit: "cal")
                StatBox(label: "On Target", value: "85", unit: "%")
                StatBox(label: "Streak", value: "7", unit: "days")
            }
            
            // Placeholder chart
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.calPrimary.opacity(0.1))
                .frame(height: 150)
                .overlay(
                    Text("Calorie trend chart")
                        .foregroundColor(.calTextSecondary)
                )
        }
        .padding(20)
        .calCard()
        .padding(.horizontal)
    }
    
    private var achievementsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Achievements")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
                .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    AchievementCard(icon: "flame.fill", title: "7 Day Streak", subtitle: "Keep it up!", color: .orange)
                    AchievementCard(icon: "target", title: "Goal Crusher", subtitle: "Hit your goal 5 times", color: .green)
                    AchievementCard(icon: "chart.line.uptrend.xyaxis", title: "Consistent", subtitle: "Logged every day", color: .blue)
                }
                .padding(.horizontal)
            }
        }
    }
}

// Stat Box Component
struct StatBox: View {
    let label: String
    let value: String
    let unit: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(.calTextSecondary)
            HStack(alignment: .bottom, spacing: 2) {
                Text(value)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                Text(unit)
                    .font(.system(size: 12))
                    .foregroundColor(.calTextSecondary)
                    .padding(.bottom, 2)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// Achievement Card Component
struct AchievementCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(color)
            
            VStack(spacing: 4) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.calTextPrimary)
                
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.calTextSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(width: 120, height: 140)
        .background(color.opacity(0.1))
        .cornerRadius(16)
    }
}

// MARK: - SCAL Insights View
struct CalInsightsView: View {
    @EnvironmentObject var dataManager: MealDataManager
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Navigation bar
                CalNavigationBar(title: "Insights")
                
                VStack(spacing: 20) {
                    // AI Insights card
                    aiInsightsCard
                    
                    // Nutrition tips
                    nutritionTipsSection
                    
                    // Meal recommendations
                    mealRecommendationsSection
                }
                .padding(.horizontal)
                .padding(.bottom, 100)
            }
        }
        .background(Color.calBackground)
    }
    
    private var aiInsightsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.calAccent)

                Text("AI Insights")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.calTextPrimary)
            }

            Text(generateInsightText())
                .font(.system(size: 16))
                .foregroundColor(.calTextSecondary)
                .lineSpacing(4)
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [Color.calAccent.opacity(0.1), Color.calAccent.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
    }

    private func generateInsightText() -> String {
        let meals = dataManager.todaysMeals

        if meals.isEmpty {
            return "Start logging your meals to get personalized AI insights about your nutrition patterns and recommendations for improving your diet."
        }

        let totalCalories = meals.reduce(0) { $0 + $1.calories }
        let totalProtein = meals.reduce(0.0) { $0 + $1.protein }
        let totalCarbs = meals.reduce(0.0) { $0 + $1.carbs }
        let totalFat = meals.reduce(0.0) { $0 + $1.fat }

        let proteinPercent = (totalProtein * 4 / Double(totalCalories)) * 100
        let carbsPercent = (totalCarbs * 4 / Double(totalCalories)) * 100
        let fatPercent = (totalFat * 9 / Double(totalCalories)) * 100

        var insights: [String] = []

        // Protein insight
        if proteinPercent > 35 {
            insights.append("You're doing great with protein intake (\(Int(proteinPercent))% of calories)!")
        } else if proteinPercent < 15 {
            insights.append("Consider increasing protein intake (currently \(Int(proteinPercent))% of calories, aim for 20-35%).")
        }

        // Carbs insight
        if carbsPercent > 65 {
            insights.append("Your carb intake is high (\(Int(carbsPercent))%). Consider balancing with more protein and healthy fats.")
        }

        // Fat insight
        if fatPercent < 20 {
            insights.append("Add more healthy fats like avocado, nuts, and olive oil to your meals.")
        }

        // Meal frequency
        if meals.count == 1 {
            insights.append("Try spreading your calories across 3-4 meals for better energy throughout the day.")
        } else if meals.count >= 3 {
            insights.append("Great job maintaining consistent meal frequency!")
        }

        return insights.isEmpty ? "Keep logging meals to track your nutrition patterns and get personalized recommendations." : insights.joined(separator: " ")
    }
    
    private var nutritionTipsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Nutrition Tips")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            VStack(spacing: 12) {
                TipCard(icon: "drop.fill", title: "Stay Hydrated", description: "Aim for 8 glasses of water daily", color: .blue)
                TipCard(icon: "leaf.fill", title: "Eat More Greens", description: "Add vegetables to every meal", color: .green)
                TipCard(icon: "clock.fill", title: "Meal Timing", description: "Space meals 3-4 hours apart", color: .orange)
            }
        }
    }
    
    private var mealRecommendationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recommended for You")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)

            if dataManager.todaysMeals.isEmpty {
                Text("Log your first meal to get personalized meal recommendations based on your remaining calories and nutrition goals.")
                    .font(.system(size: 14))
                    .foregroundColor(.calTextSecondary)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.calAccent.opacity(0.1))
                    .cornerRadius(12)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(generateMealSuggestions(), id: \.name) { suggestion in
                            MealSuggestionCard(
                                name: suggestion.name,
                                calories: suggestion.calories,
                                time: suggestion.mealType
                            )
                        }
                    }
                }
            }
        }
    }

    private func generateMealSuggestions() -> [(name: String, calories: Int, mealType: String)] {
        let totalConsumed = dataManager.todaysMeals.reduce(0) { $0 + $1.calories }
        let remaining = max(0, 2288 - totalConsumed) // User's daily goal

        var suggestions: [(name: String, calories: Int, mealType: String)] = []

        // Determine what meal types are missing
        let hasBreakfast = dataManager.todaysMeals.contains { $0.time == "Breakfast" }
        let hasLunch = dataManager.todaysMeals.contains { $0.time == "Lunch" }
        let hasDinner = dataManager.todaysMeals.contains { $0.time == "Dinner" }

        let hour = Calendar.current.component(.hour, from: Date())

        // Morning suggestions (before 11am)
        if hour < 11 && !hasBreakfast && remaining > 300 {
            suggestions.append(("Greek Yogurt with Berries", min(320, remaining), "Breakfast"))
            suggestions.append(("Oatmeal with Nuts", min(380, remaining), "Breakfast"))
        }

        // Afternoon suggestions (11am-4pm)
        if hour >= 11 && hour < 16 && !hasLunch && remaining > 400 {
            suggestions.append(("Grilled Chicken Salad", min(450, remaining), "Lunch"))
            suggestions.append(("Mediterranean Bowl", min(520, remaining), "Lunch"))
        }

        // Evening suggestions (after 4pm)
        if hour >= 16 && !hasDinner && remaining > 400 {
            suggestions.append(("Grilled Salmon with Vegetables", min(480, remaining), "Dinner"))
            suggestions.append(("Lean Steak with Sweet Potato", min(580, remaining), "Dinner"))
        }

        // Snack suggestions if remaining calories are low
        if remaining > 100 && remaining < 400 {
            suggestions.append(("Protein Smoothie", min(280, remaining), "Snack"))
            suggestions.append(("Apple with Almond Butter", min(200, remaining), "Snack"))
        }

        // Return top 3 suggestions or empty if none applicable
        return Array(suggestions.prefix(3))
    }
}

// Tip Card Component
struct TipCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
                .frame(width: 40, height: 40)
                .background(color.opacity(0.1))
                .cornerRadius(12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.calTextPrimary)
                
                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(.calTextSecondary)
            }
            
            Spacer()
        }
        .padding(16)
        .calCard()
    }
}

// Meal Suggestion Card
struct MealSuggestionCard: View {
    let name: String
    let calories: Int
    let time: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.calPrimary.opacity(0.1))
                .frame(width: 160, height: 100)
                .overlay(
                    Image(systemName: "photo")
                        .font(.system(size: 32))
                        .foregroundColor(.calPrimary.opacity(0.3))
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.calTextPrimary)
                    .lineLimit(2)
                
                HStack {
                    Text("\(calories) cal")
                        .font(.system(size: 12))
                        .foregroundColor(.calPrimary)
                    
                    Text("•")
                        .foregroundColor(.calTextSecondary)
                    
                    Text(time)
                        .font(.system(size: 12))
                        .foregroundColor(.calTextSecondary)
                }
            }
        }
        .frame(width: 160)
        .padding(12)
        .calCard()
    }
}

// MARK: - Localization Manager
class LocalizationManager: ObservableObject {
    static let shared = LocalizationManager()
    
    @Published var language: Language = .english {
        didSet {
            UserDefaults.standard.set(language.rawValue, forKey: "selectedLanguage")
        }
    }
    
    enum Language: String, CaseIterable {
        case english = "en"
        case arabic = "ar"
        
        var displayName: String {
            switch self {
            case .english: return "English"
            case .arabic: return "العربية"
            }
        }
    }
    
    init() {
        if let saved = UserDefaults.standard.string(forKey: "selectedLanguage"),
           let lang = Language(rawValue: saved) {
            self.language = lang
        }
    }
    
    func localized(_ key: String) -> String {
        // Simple dictionary-based localization
        let dict: [String: [String: String]] = [
            "Profile": ["en": "Profile", "ar": "الملف الشخصي"],
            "Settings": ["en": "Settings", "ar": "الإعدادات"],
            "Dark Mode": ["en": "Dark Mode", "ar": "الوضع الداكن"],
            "Language": ["en": "Language", "ar": "اللغة"],
            "English": ["en": "English", "ar": "الإنجليزية"],
            "Arabic": ["en": "Arabic", "ar": "العربية"],
            "Your Journey": ["en": "Your Journey", "ar": "رحلتك"],
            "Total Meals": ["en": "Total Meals", "ar": "الوجبات"],
            "Days Active": ["en": "Days Active", "ar": "الأيام النشطة"],
            "Avg Calories": ["en": "Avg Calories", "ar": "متوسط السعرات"],
            "Goals Hit": ["en": "Goals Hit", "ar": "تحقيق الأهداف"],
            "Daily Goals": ["en": "Daily Goals", "ar": "الأهداف اليومية"],
            "Calories": ["en": "Calories", "ar": "سعرات"],
            "Protein": ["en": "Protein", "ar": "بروتين"],
            "Carbs": ["en": "Carbs", "ar": "كربوهيدرات"],
            "Fat": ["en": "Fat", "ar": "دهون"],
            "Hydration": ["en": "Hydration", "ar": "ترطيب"],
            "Streak": ["en": "Streak", "ar": "سلسلة"],
            "More": ["en": "More", "ar": "المزيد"],
            "Support": ["en": "Support", "ar": "الدعم"],
            "Services": ["en": "Services", "ar": "الخدمات"],
            "Services Subtitle": ["en": "Book consultations, events, and rewards in one place.", "ar": "احجز الاستشارات والفعاليات والمكافآت من مكان واحد."],
            "Telehealth": ["en": "Telehealth", "ar": "الرعاية عن بُعد"],
            "Telehealth Subtitle": ["en": "Connect with Dubai nutritionists and doctors.", "ar": "تواصل مع اختصاصيي التغذية والأطباء في دبي."],
            "Book Now": ["en": "Book Now", "ar": "احجز الآن"],
            "Events Subtitle": ["en": "Register for Dubai Marathon, Run, Ride, and more.", "ar": "سجل في ماراثون دبي والجري وركوب الدراجات والمزيد."],
            "Loyalty & Rewards": ["en": "Loyalty & Rewards", "ar": "الولاء والمكافآت"],
            "Loyalty Subtitle": ["en": "Track Enso, DIP DASH, and Poke & Co perks.", "ar": "تابع مزايا إنسو وديب داش وبوك آند كو."],
            "Open Dashboard": ["en": "Open Dashboard", "ar": "افتح لوحة التحكم"],
            "Quick Actions": ["en": "Quick Actions", "ar": "إجراءات سريعة"],
            "Quick Actions Subtitle": ["en": "Log meals, water, and voice entries instantly.", "ar": "سجل الوجبات والماء والأوامر الصوتية فوراً."],
            "Daily Snapshot": ["en": "Daily Snapshot", "ar": "نظرة يومية"],
            "Daily Snapshot Subtitle": ["en": "Stay on top of calories, workouts, and macros.", "ar": "تابع السعرات والتمارين والمغذيات دائماً."],
            "Wellness & Reminders": ["en": "Wellness & Reminders", "ar": "العافية والتنبيهات"],
            "Wellness Subtitle": ["en": "Hydration, fasting, and local foods stay in sync.", "ar": "ترطيبك والصيام والأطعمة المحلية متزامنة دائماً."],
            "Track healthy restaurant rewards and order within SCAL.": ["en": "Track healthy restaurant rewards and order within SCAL.", "ar": "تابع مكافآت المطاعم الصحية واطلب داخل SCAL."],
            "Open Loyalty Dashboard": ["en": "Open Loyalty Dashboard", "ar": "افتح لوحة الولاء"],
            "Points": ["en": "Points", "ar": "نقاط"],
            "Your Rewards": ["en": "Your Rewards", "ar": "مكافآتك"],
            "Partners": ["en": "Partners", "ar": "شركاء"],
            "Recent Activity": ["en": "Recent Activity", "ar": "آخر النشاطات"],
            "Order Now": ["en": "Order Now", "ar": "اطلب الآن"],
            "Wearable Sync": ["en": "Wearable Sync", "ar": "مزامنة الأجهزة"],
            "Connect": ["en": "Connect", "ar": "اتصال"],

            "Friend": ["en": "Friend", "ar": "صديقي"],
            "Daily": ["en": "Daily", "ar": "يومي"],
            "Weekly": ["en": "Weekly", "ar": "أسبوعي"],
            "Fasting Tips": ["en": "Fasting Tips", "ar": "نصائح الصيام"],
            "Local Favorites": ["en": "Local Favorites", "ar": "الأطباق المحلية"],
            "Health Integration": ["en": "Health Integration", "ar": "تكامل الصحة"],
            "Apple Health": ["en": "Apple Health", "ar": "صحة Apple"],
            "Connected": ["en": "Connected", "ar": "متصل"],
            "Not Connected": ["en": "Not Connected", "ar": "غير متصل"],
            "Sync Now": ["en": "Sync Now", "ar": "مزامنة الآن"],
            "Cloud Sync": ["en": "Cloud Sync", "ar": "مزامنة سحابية"],
            "iCloud Backup": ["en": "iCloud Backup", "ar": "نسخ احتياطي iCloud"],
            "Last synced": ["en": "Last synced", "ar": "آخر مزامنة"],
            "Export Data": ["en": "Export Data", "ar": "تصدير البيانات"],
            "Clear All Data": ["en": "Clear All Data", "ar": "مسح جميع البيانات"],
            "About SCAL": ["en": "About SCAL", "ar": "عن SCAL"],
            "Edit Profile": ["en": "Edit Profile", "ar": "تعديل الملف"],
            "Age": ["en": "Age", "ar": "العمر"],
            "Weight": ["en": "Weight", "ar": "الوزن"],
            "Height": ["en": "Height", "ar": "الطول"],
            "User": ["en": "User", "ar": "مستخدم"],
            "Welcome to SCAL": ["en": "Welcome to SCAL", "ar": "مرحبًا بك في SCAL"],
            "Your intelligent nutrition companion": ["en": "Your intelligent nutrition companion", "ar": "رفيقك الذكي للتغذية"],
            "Get Started": ["en": "Get Started", "ar": "ابدأ الآن"],
            "Scan Barcode": ["en": "Scan Barcode", "ar": "مسح الباركود"],
            "Take a photo of your meal": ["en": "Take a photo of your meal", "ar": "التقط صورة لوجبتك"],
            "Open Camera": ["en": "Open Camera", "ar": "فتح الكاميرا"],
            "Retake": ["en": "Retake", "ar": "إعادة"],
            "Manual Search": ["en": "Manual Search", "ar": "بحث يدوي"],
            "Multi-Food": ["en": "Multi-Food", "ar": "متعدد الأطعمة"],
            "Food Detected": ["en": "Food Detected", "ar": "تم اكتشاف الطعام"],
            "Hey": ["en": "Hey", "ar": "مرحبًا"],
            "Today's Insights": ["en": "Today's Insights", "ar": "رؤى اليوم"],
            "Refresh": ["en": "Refresh", "ar": "تحديث"],
            "CoachEmptyInsights": ["en": "Log meals and water so I can highlight trends.", "ar": "سجل وجباتك ومياهك لأبرز لك الأنماط."],
            "Active Quest": ["en": "Active Quest", "ar": "التحدي الحالي"],
            "View": ["en": "View", "ar": "عرض"],
            "Hydrate Quest Title": ["en": "Hydrate x3", "ar": "ترطيب ×٣"],
            "Hydrate Quest Description": ["en": "Log water three times before 6 PM for a refreshed body.", "ar": "سجل الماء ثلاث مرات قبل السادسة مساءً لجسم منتعش."],
            "Quest Reward": ["en": "+1 Consistency", "ar": "+١ التزام"],
            "Coach Modules": ["en": "Coach Modules", "ar": "خدمات المدرب"],
            "Ask Coach": ["en": "Ask Coach", "ar": "اسأل المدرب"],
            "Clear": ["en": "Clear", "ar": "مسح"],
            "Book Telehealth": ["en": "Book Telehealth", "ar": "حجز استشارة"],
            "Done": ["en": "Done", "ar": "تم"],
            "Your consultation is confirmed.": ["en": "Your consultation is confirmed.", "ar": "تم تأكيد الاستشارة."],
            "Choose a specialist": ["en": "Choose a specialist", "ar": "اختر الأخصائي"],
            "Date": ["en": "Date", "ar": "التاريخ"],
            "Select a date": ["en": "Select a date", "ar": "اختر التاريخ"],
            "Timeslots": ["en": "Timeslots", "ar": "أوقات"],
            "No slots available": ["en": "No slots available", "ar": "لا توجد أوقات"],
            "Virtual consultation": ["en": "Virtual consultation", "ar": "استشارة افتراضية"],
            "In-person": ["en": "In-person", "ar": "حضورياً"],
            "Notes": ["en": "Notes", "ar": "ملاحظات"],
            "Consent": ["en": "Consent", "ar": "موافقة"],
            "Consent footer": ["en": "Dubai telehealth regulations require explicit consent before booking. All sessions are encrypted.", "ar": "تتطلب لوائح دبي للصحة عن بعد موافقة صريحة قبل الحجز. جميع الجلسات مشفرة."],
            "I understand Dubai's telehealth regulations and consent to share my data.": ["en": "I understand Dubai's telehealth regulations and consent to share my data.", "ar": "أفهم لوائح دبي للصحة عن بعد وأوافق على مشاركة بياناتي."],
            "Confirm Consultation": ["en": "Confirm Consultation", "ar": "تأكيد الاستشارة"],
            "Booking": ["en": "Booking", "ar": "الحجز"],
            "Community Events": ["en": "Community Events", "ar": "فعاليات المجتمع"],
            "All": ["en": "All", "ar": "الكل"],
            "No upcoming events": ["en": "No upcoming events", "ar": "لا يوجد فعاليات"],
            "Register": ["en": "Register", "ar": "التسجيل"],
            "Add to SCAL Calendar": ["en": "Add to SCAL Calendar", "ar": "إضافة إلى تقويم SCAL"],
            "Race": ["en": "Race", "ar": "سباق"],
            "Ride": ["en": "Ride", "ar": "دراجة"],
            "Yoga": ["en": "Yoga", "ar": "يوغا"],
            "Entertainment": ["en": "Entertainment", "ar": "ترفيه"],
            "Food": ["en": "Food", "ar": "مأكولات"],
            "Confirm Meal": ["en": "Confirm Meal", "ar": "تأكيد الوجبة"],
            "Retry": ["en": "Retry", "ar": "إعادة المحاولة"],
            "Search": ["en": "Search", "ar": "بحث"],
            "Tap to scan your food": ["en": "Tap to scan your food", "ar": "انقر لمسح طعامك"],
            "Take a photo or choose from library": ["en": "Take a photo or choose from library", "ar": "التقط صورة أو اختر من المكتبة"],
            "Recent Meals": ["en": "Recent Meals", "ar": "الوجبات الأخيرة"],
            "Enter Barcode Number": ["en": "Enter Barcode Number", "ar": "أدخل رقم الباركود"],
            "Enter manually": ["en": "Enter manually", "ar": "إدخال يدوي"],
            "Position barcode in frame": ["en": "Position barcode in frame", "ar": "ضع الباركود في الإطار"],
            "Cancel": ["en": "Cancel", "ar": "إلغاء"],
            "Home": ["en": "Home", "ar": "الرئيسية"],
            "Scanner": ["en": "Scanner", "ar": "ماسح"],
            "Voice": ["en": "Voice", "ar": "صوت"],
            "Coach": ["en": "Coach", "ar": "مدرب"],
            "Breakfast": ["en": "Breakfast", "ar": "فطور"],
            "Lunch": ["en": "Lunch", "ar": "غداء"],
            "Dinner": ["en": "Dinner", "ar": "عشاء"],
            "Snacks": ["en": "Snacks", "ar": "وجبات خفيفة"],
            "Today's Progress": ["en": "Today's Progress", "ar": "تقدم اليوم"],
            "Meals Logged": ["en": "Meals Logged", "ar": "وجبات مسجلة"],
            "Total Calories": ["en": "Total Calories", "ar": "إجمالي السعرات"],
            "Remaining": ["en": "Remaining", "ar": "المتبقي"],
            "Consumed": ["en": "Consumed", "ar": "المستهلك"],
            "Burned": ["en": "Burned", "ar": "المحروق"],
            "Water": ["en": "Water", "ar": "ماء"],
            "Add Water": ["en": "Add Water", "ar": "إضافة ماء"],
            "Quick Add": ["en": "Quick Add", "ar": "إضافة سريعة"],
            "No meals logged today": ["en": "No meals logged today", "ar": "لم يتم تسجيل وجبات اليوم"],
            "Start by scanning your food!": ["en": "Start by scanning your food!", "ar": "ابدأ بمسح طعامك!"],
            "Nutrition Tips": ["en": "Nutrition Tips", "ar": "نصائح غذائية"],
            "Recommended for You": ["en": "Recommended for You", "ar": "موصى به لك"],
            "AI Insights": ["en": "AI Insights", "ar": "رؤى الذكاء الاصطناعي"],
            "What brings you to SCAL?": ["en": "What brings you to SCAL?", "ar": "ما الذي أتى بك إلى SCAL؟"],
            "Lose Weight": ["en": "Lose Weight", "ar": "إنقاص الوزن"],
            "Maintain Weight": ["en": "Maintain Weight", "ar": "الحفاظ على الوزن"],
            "Gain Muscle": ["en": "Gain Muscle", "ar": "بناء العضلات"],
            "Be Healthier": ["en": "Be Healthier", "ar": "صحة أفضل"],
            "Continue": ["en": "Continue", "ar": "متابعة"],
            "Select Gender": ["en": "Select Gender", "ar": "اختر الجنس"],
            "Male": ["en": "Male", "ar": "ذكر"],
            "Female": ["en": "Female", "ar": "أنثى"],
            "Other": ["en": "Other", "ar": "آخر"],
            "Activity Level": ["en": "Activity Level", "ar": "مستوى النشاط"],
            "Sedentary": ["en": "Sedentary", "ar": "خامل"],
            "Light": ["en": "Light", "ar": "خفيف"],
            "Moderate": ["en": "Moderate", "ar": "متوسط"],
            "Active": ["en": "Active", "ar": "نشط"],
            "Very Active": ["en": "Very Active", "ar": "نشط جداً"],
            "Personal Details": ["en": "Personal Details", "ar": "تفاصيل شخصية"],
            "Your Name": ["en": "Your Name", "ar": "اسمك"],
            "Age (years)": ["en": "Age (years)", "ar": "العمر (سنوات)"],
            "Weight (kg)": ["en": "Weight (kg)", "ar": "الوزن (كجم)"],
            "Height (cm)": ["en": "Height (cm)", "ar": "الطول (سم)"],
            "Setup Complete!": ["en": "Setup Complete!", "ar": "اكتمل الإعداد!"],
            "You're ready to start tracking": ["en": "You're ready to start tracking", "ar": "أنت جاهز لبدء التتبع"],
            "Start Tracking": ["en": "Start Tracking", "ar": "ابدأ التتبع"],
        ]
        
        return dict[key]?[language.rawValue] ?? key
    }
    
    var isRTL: Bool {
        return language == .arabic
    }
}

// MARK: - SCAL Profile View
struct CalProfileView: View {
    @EnvironmentObject var profileManager: UserProfileManager
    @EnvironmentObject var dataManager: MealDataManager
    @StateObject private var healthKit = HealthKitManager.shared
    @StateObject private var cloudKit = CloudKitManager.shared
    @StateObject private var localization = LocalizationManager.shared
    @State private var showingSettings = false
    @State private var showingHealthKitSync = false
    @State private var showingPrivacy = false
    @State private var showingSupport = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Navigation bar
                CalNavigationBar(
                    title: "Profile",
                    rightButton: AnyView(
                        Button(action: { showingSettings = true }) {
                            Image(systemName: "gearshape.fill")
                                .font(.system(size: 22))
                                .foregroundColor(.calTextPrimary)
                        }
                    )
                )
                
                VStack(spacing: 24) {
                    // Profile header
                    profileHeaderCard
                    
                    // Stats overview
                    statsOverviewCard
                    
                    // Goals section
                    goalsSection
                    
                    // HealthKit section
                    healthKitSection
                    
                    // CloudKit sync section
                    cloudKitSection
                    
                    // Settings options
                    settingsSection
                }
                .padding(.horizontal)
                .padding(.bottom, 100)
            }
        }
        .background(Color.calBackground)
        .sheet(isPresented: $showingSettings) {
            NavigationView {
                SettingsView()
            }
        }
    }
    
    private var profileHeaderCard: some View {
        VStack(spacing: 16) {
            // Profile picture
            ZStack {
                Circle()
                    .fill(Color.calPrimary.opacity(0.1))
                    .frame(width: 100, height: 100)
                
                Text(profileManager.userName.prefix(2).uppercased())
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.calPrimary)
            }
            
            Text(profileManager.userName.isEmpty ? "User" : profileManager.userName)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            HStack(spacing: 40) {
                VStack(spacing: 4) {
                    Text("\(profileManager.age)")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.calTextPrimary)
                    Text("Age")
                        .font(.system(size: 12))
                        .foregroundColor(.calTextSecondary)
                }
                
                VStack(spacing: 4) {
                    HStack(spacing: 4) {
                        Text("\(Int(healthKit.latestWeight ?? profileManager.weight)) kg")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.calTextPrimary)
                        if healthKit.latestWeight != nil {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 10))
                                .foregroundColor(.calPrimary)
                        }
                    }
                    Text("Weight")
                        .font(.system(size: 12))
                        .foregroundColor(.calTextSecondary)
                }
                
                VStack(spacing: 4) {
                    Text("\(Int(profileManager.height)) cm")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.calTextPrimary)
                    Text("Height")
                        .font(.system(size: 12))
                        .foregroundColor(.calTextSecondary)
                }
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .calCard()
    }
    
    private var statsOverviewCard: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Your Journey")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                Spacer()
            }
            
            HStack(spacing: 16) {
                StatCard(title: "Total Meals", value: "156", icon: "fork.knife", color: .orange)
                StatCard(title: "Days Active", value: "28", icon: "calendar", color: .blue)
            }
            
            HStack(spacing: 16) {
                StatCard(title: "Avg Calories", value: "2,150", icon: "flame.fill", color: .red)
                StatCard(title: "Goals Hit", value: "85%", icon: "target", color: .green)
            }
        }
        .padding(20)
        .calCard()
    }
    
    private var goalsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Daily Goals")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            VStack(spacing: 12) {
                GoalRow(icon: "flame.fill", label: "Calories", value: "\(profileManager.calorieGoal)", color: .orange)
                GoalRow(icon: "p.circle.fill", label: "Protein", value: "\(Int(profileManager.proteinGoal))g", color: .red)
                GoalRow(icon: "c.circle.fill", label: "Carbs", value: "\(Int(profileManager.carbsGoal))g", color: .orange)
                GoalRow(icon: "f.circle.fill", label: "Fat", value: "\(Int(profileManager.fatGoal))g", color: .blue)
            }
        }
        .padding(20)
        .calCard()
    }
    
    private var healthKitSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Health Integration")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                Spacer()
                if healthKit.isAuthorized {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.calPrimary)
                }
            }
            
            VStack(spacing: 12) {
                // HealthKit sync status
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .frame(width: 24)
                    
                    Text("Apple Health")
                        .font(.system(size: 16))
                        .foregroundColor(.calTextPrimary)
                    
                    Spacer()
                    
                    if healthKit.isAuthorized {
                        HStack(spacing: 4) {
                            Text("Connected")
                                .font(.system(size: 14))
                                .foregroundColor(.calPrimary)
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 14))
                                .foregroundColor(.calPrimary)
                        }
                    } else {
                        Button(action: { showingHealthKitSync = true }) {
                            Text("Connect")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.calPrimary)
                        }
                    }
                }
                
                if healthKit.isAuthorized {
                    // Workout calories
                    HStack {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                            .frame(width: 24)
                        
                        Text("Workout Calories")
                            .font(.system(size: 16))
                            .foregroundColor(.calTextSecondary)
                        
                        Spacer()
                        
                        Text("\(healthKit.todaysWorkoutCalories) cal")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.calTextPrimary)
                    }
                    
                    // Water intake
                    HStack {
                        Image(systemName: "drop.fill")
                            .foregroundColor(.blue)
                            .frame(width: 24)
                        
                        Text("Water Intake")
                            .font(.system(size: 16))
                            .foregroundColor(.calTextSecondary)
                        
                        Spacer()
                        
                        Text(String(format: "%.1f L", healthKit.todaysWaterIntake))
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.calTextPrimary)
                    }
                }
            }
        }
        .padding(20)
        .calCard()
        .sheet(isPresented: $showingHealthKitSync) {
            HealthKitSyncView()
        }
    }
    
    private var cloudKitSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("iCloud Sync")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                Spacer()
                if cloudKit.isSyncing {
                    ProgressView()
                        .scaleEffect(0.8)
                } else if cloudKit.isAvailable {
                    Image(systemName: "checkmark.icloud.fill")
                        .foregroundColor(.calPrimary)
                }
            }
            
            VStack(spacing: 12) {
                // iCloud sync status
                HStack {
                    Image(systemName: "icloud.fill")
                        .foregroundColor(.blue)
                        .frame(width: 24)
                    
                    Text("iCloud Sync")
                        .font(.system(size: 16))
                        .foregroundColor(.calTextPrimary)
                    
                    Spacer()
                    
                    if cloudKit.isAvailable {
                        VStack(alignment: .trailing, spacing: 2) {
                            HStack(spacing: 4) {
                                Text("Active")
                                    .font(.system(size: 14))
                                    .foregroundColor(.calPrimary)
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(.calPrimary)
                            }
                            if let lastSync = cloudKit.lastSyncDate {
                                Text("Last sync: \(lastSync, style: .relative)")
                                    .font(.system(size: 11))
                                    .foregroundColor(.calTextSecondary)
                            }
                        }
                    } else {
                        Text(cloudKit.syncError ?? "Not Available")
                            .font(.system(size: 14))
                            .foregroundColor(.red)
                    }
                }
                
                if cloudKit.isAvailable {
                    // Sync now button
                    Button(action: {
                        Task {
                            await dataManager.syncWithCloud()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 16))
                            Text("Sync Now")
                                .font(.system(size: 14, weight: .medium))
                        }
                        .foregroundColor(.calPrimary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.calPrimary.opacity(0.1))
                        .cornerRadius(20)
                    }
                    .disabled(cloudKit.isSyncing)
                    
                    Text("Your meals sync automatically across all your devices")
                        .font(.caption)
                        .foregroundColor(.calTextSecondary)
                }
            }
        }
        .padding(20)
        .calCard()
    }
    
    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(localization.localized("More"))
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            VStack(spacing: 12) {
                SettingRow(icon: "gearshape.fill", title: localization.localized("Settings")) {
                    showingSettings = true
                }
                
                SettingRow(icon: "questionmark.circle.fill", title: localization.localized("Support")) {
                    if let url = URL(string: "mailto:support@scal-app.com") {
                        UIApplication.shared.open(url)
                    }
                }
                
                SettingRow(icon: "lock.fill", title: localization.localized("Privacy Policy")) {
                    if let url = URL(string: "https://scal-app.com/privacy") {
                        UIApplication.shared.open(url)
                    }
                }
            }
        }
        .padding(20)
        .calCard()
    }
}

// Stat Card for Profile
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
            
            Text(value)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            Text(title)
                .font(.system(size: 12))
                .foregroundColor(.calTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// Goal Row Component
struct GoalRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)
            
            Text(label)
                .font(.system(size: 16))
                .foregroundColor(.calTextSecondary)
            
            Spacer()
            
            Text(value)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.calTextPrimary)
        }
        .padding(.vertical, 8)
    }
}

// Setting Row Component
struct SettingRow: View {
    let icon: String
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(.calPrimary)
                    .frame(width: 32)
                
                Text(title)
                    .font(.system(size: 16))
                    .foregroundColor(.calTextPrimary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14))
                    .foregroundColor(.calTextSecondary)
            }
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .calCard()
        }
    }
}

// Simple Voice View
struct SimpleVoiceView: View {
    @EnvironmentObject var dataManager: MealDataManager
    @StateObject private var voiceManager = VoiceRecognitionManager.shared
    @State private var showingResult = false
    @State private var detectedMeal: (name: String, calories: Int)?
    @State private var showingPermissionAlert = false
    @State private var isProcessingFood = false

    // Multi-food voice logging (Phase 2.5)
    @State private var showingMultiFoodConfirmation = false
    @State private var detectedFoodItems: [String] = []
    @State private var originalVoiceText = ""
    
    var body: some View {
        ZStack {
            VStack(spacing: 40) {
                // Glass Navigation Bar
                Text("VOICE")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.calTextPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                
                Spacer()
                
                // Voice animation with glass effect
                ZStack {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 150, height: 150)
                        .overlay(
                            Circle()
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            Color.white.opacity(0.5),
                                            Color.white.opacity(0.1)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        )
                    
                    if voiceManager.isRecording {
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [Color.red, Color.orange],
                                    startPoint: .top,
                                    endPoint: .bottom
                                ),
                                lineWidth: 3
                            )
                            .frame(width: 150, height: 150)
                            .scaleEffect(voiceManager.isRecording ? 1.3 : 1.0)
                            .opacity(voiceManager.isRecording ? 0 : 1)
                            .animation(.easeOut(duration: 1).repeatForever(autoreverses: false), value: voiceManager.isRecording)
                    }
                    
                    Image(systemName: voiceManager.isRecording ? "mic.fill" : "mic")
                        .font(.system(size: 50))
                        .foregroundColor(voiceManager.isRecording ? .red : .white)
                }
                
                // Status text
                Text(voiceManager.isRecording ? "Listening..." : "Tap to speak")
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.7))
                
                // Show real-time transcription
                if voiceManager.isRecording && !voiceManager.recognizedText.isEmpty {
                    Text(voiceManager.recognizedText)
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                        .transition(.opacity)
                }
                
                // Record button with glass effect
                Button(action: toggleRecording) {
                    HStack {
                        if isProcessingFood {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Text(voiceManager.isRecording ? "Stop" : "Start Recording")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                    }
                    .frame(width: 200, height: 50)
                }
                .calPrimaryButton()
                .disabled(isProcessingFood || !voiceManager.isAuthorized)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(voiceManager.isRecording ? Color.red : Color.clear, lineWidth: 2)
                )
            
                // Voice text display with glass effect
                if !voiceManager.recognizedText.isEmpty && !voiceManager.isRecording {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("You said:")
                            .font(.headline)
                            .foregroundColor(.white)
                        Text(voiceManager.recognizedText)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .foregroundColor(.white.opacity(0.9))
                            .calCard()
                    }
                    .padding(.horizontal)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                
                // Example phrases with glass effect
                VStack(alignment: .leading, spacing: 8) {
                    Text("Try saying:")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))

                    Text("• I ate eggs, toast, and coffee")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    Text("• Just had a burger, fries, and soda")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    Text("• Grilled chicken with rice and broccoli")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    Text("✨ Multi-food detection enabled!")
                        .font(.caption2)
                        .foregroundColor(.calPrimary.opacity(0.8))
                }
                .padding()
                .calCard()
                .padding(.horizontal)
                
                Spacer()
            }
        }
        .sheet(isPresented: $showingMultiFoodConfirmation) {
            VoiceMultiFoodConfirmationView(
                originalText: originalVoiceText,
                foodItems: detectedFoodItems,
                onConfirm: { items in
                    // Log all confirmed items
                    for item in items {
                        dataManager.addMeal(
                            name: item.displayName,
                            calories: item.calories,
                            protein: item.protein,
                            carbs: item.carbs,
                            fat: item.fat,
                            source: "Voice"
                        )
                    }

                    // Success feedback
                    let notificationFeedback = UINotificationFeedbackGenerator()
                    notificationFeedback.notificationOccurred(.success)

                    // Clear voice text
                    voiceManager.recognizedText = ""
                },
                onCancel: {
                    // Just close the sheet
                    voiceManager.recognizedText = ""
                }
            )
        }
        .alert(voiceManager.isAuthorized ? "Meal Logged!" : "Microphone Access Required", isPresented: showingPermissionAlert ? $showingPermissionAlert : $showingResult) {
            if voiceManager.isAuthorized {
                Button("OK") {
                    voiceManager.recognizedText = ""
                }
            } else {
                Button("Open Settings", role: .cancel) {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                Button("Cancel", role: .destructive) {}
            }
        } message: {
            if voiceManager.isAuthorized {
                if let meal = detectedMeal {
                    Text("\(meal.name) (\(meal.calories) calories) has been added")
                }
            } else {
                Text("SCAL needs microphone access to use voice commands. Please enable it in Settings.")
            }
        }
        .onAppear {
            setupVoiceRecognition()
        }
        .onDisappear {
            if voiceManager.isRecording {
                voiceManager.stopRecording()
            }
        }
    }
    
    private func toggleRecording() {
        if !voiceManager.isAuthorized {
            showingPermissionAlert = true
            return
        }
        
        if voiceManager.isRecording {
            voiceManager.stopRecording()
        } else {
            do {
                try voiceManager.startRecording()
                // Haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.impactOccurred()
            } catch {
                print("Failed to start recording: \(error)")
            }
        }
    }
    
    private func setupVoiceRecognition() {
        // Listen for voice recognition completion (Phase 2.5: Multi-food support)
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("VoiceRecognitionCompleted"),
            object: nil,
            queue: .main
        ) { notification in
            // Check for new multi-food format first
            if let foodItems = notification.userInfo?["foodItems"] as? [String],
               let originalText = notification.userInfo?["originalText"] as? String {
                // Multi-food voice logging (Phase 2.5)
                self.processMultipleFoods(foodItems, originalText: originalText)
            }
            // Legacy single-food fallback (for backward compatibility)
            else if let foodText = notification.userInfo?["foodText"] as? String,
                    let originalText = notification.userInfo?["originalText"] as? String {
                processRecognizedFood(foodText, originalText: originalText)
            }
        }
    }
    
    private func processRecognizedFood(_ foodText: String, originalText: String) {
        isProcessingFood = true
        
        // Search USDA API
        Task {
            let foodSearch = SimpleFoodSearchService.shared
            await foodSearch.searchFood(query: foodText)
            
            await MainActor.run {
                if let firstResult = foodSearch.searchResults.first {
                    detectedMeal = (firstResult.name, Int(firstResult.calories))
                    dataManager.addMeal(
                        name: firstResult.name,
                        calories: Int(firstResult.calories),
                        protein: firstResult.protein,
                        carbs: firstResult.carbs,
                        fat: firstResult.fat,
                        source: "Voice"
                    )
                } else {
                    // Fallback with default calories
                    detectedMeal = (foodText.capitalized, 250)
                    dataManager.addMeal(
                        name: foodText.capitalized,
                        calories: 250,
                        source: "Voice"
                    )
                }
                
                isProcessingFood = false
                showingResult = true
                
                // Haptic feedback
                let notificationFeedback = UINotificationFeedbackGenerator()
                notificationFeedback.notificationOccurred(.success)
            }
        }
    }

    // MARK: - Multi-Food Processing (Phase 2.5)

    private func processMultipleFoods(_ foodItems: [String], originalText: String) {
        guard !foodItems.isEmpty else {
            print("No food items extracted from voice input")
            return
        }

        // Store the data for the sheet
        self.detectedFoodItems = foodItems
        self.originalVoiceText = originalText

        // Show the multi-food confirmation sheet
        showingMultiFoodConfirmation = true

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
}

// MARK: - Voice Multi-Food Models & Views (Phase 2.5)

// Simplified food item model for voice detection (no bounding box/confidence needed)
struct VoiceDetectedFoodItem: Identifiable {
    let id = UUID()
    let foodName: String
    var isSelected: Bool = true // Selected by default for logging
    var searchResult: SimpleFood? // USDA search result once fetched

    var displayName: String {
        searchResult?.name ?? foodName.capitalized
    }

    var calories: Int {
        Int(searchResult?.calories ?? 0)
    }

    var protein: Double {
        searchResult?.protein ?? 0
    }

    var carbs: Double {
        searchResult?.carbs ?? 0
    }

    var fat: Double {
        searchResult?.fat ?? 0
    }
}

// Voice Multi-Food Confirmation View
struct VoiceMultiFoodConfirmationView: View {
    let originalText: String
    let foodItems: [String]
    let onConfirm: ([VoiceDetectedFoodItem]) -> Void
    let onCancel: () -> Void

    @State private var detectedItems: [VoiceDetectedFoodItem]
    @State private var isLoadingNutrition = false
    @State private var selectedItems: Set<UUID> = []
    @Environment(\.dismiss) private var dismiss

    init(originalText: String, foodItems: [String], onConfirm: @escaping ([VoiceDetectedFoodItem]) -> Void, onCancel: @escaping () -> Void) {
        self.originalText = originalText
        self.foodItems = foodItems
        self.onConfirm = onConfirm
        self.onCancel = onCancel

        // Initialize items from food names
        self._detectedItems = State(initialValue: foodItems.map { VoiceDetectedFoodItem(foodName: $0) })
        self._selectedItems = State(initialValue: Set(foodItems.indices.map { _ in UUID() }))
    }

    var selectedItemsArray: [VoiceDetectedFoodItem] {
        detectedItems.filter { $0.isSelected }
    }

    var totalCalories: Int {
        selectedItemsArray.reduce(0) { $0 + $1.calories }
    }

    var totalProtein: Double {
        selectedItemsArray.reduce(0.0) { $0 + $1.protein }
    }

    var totalCarbs: Double {
        selectedItemsArray.reduce(0.0) { $0 + $1.carbs }
    }

    var totalFat: Double {
        selectedItemsArray.reduce(0.0) { $0 + $1.fat }
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: "mic.circle.fill")
                            .font(.system(size: 50))
                            .foregroundColor(.calPrimary)

                        Text("Voice Detected Foods")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.calTextPrimary)

                        Text("You said: \"\(originalText)\"")
                            .font(.system(size: 14))
                            .foregroundColor(.calTextSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding(.top)

                    // Total nutrition summary (only if items have been fetched)
                    if !isLoadingNutrition && detectedItems.contains(where: { $0.searchResult != nil }) {
                        VStack(spacing: 16) {
                            Text("Total Nutrition")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.calTextPrimary)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            HStack(spacing: 16) {
                                VStack {
                                    Text("\(totalCalories)")
                                        .font(.system(size: 28, weight: .bold))
                                        .foregroundColor(.orange)
                                    Text("calories")
                                        .font(.caption)
                                        .foregroundColor(.calTextSecondary)
                                }
                                .frame(maxWidth: .infinity)

                                VStack {
                                    Text("\(Int(totalProtein))g")
                                        .font(.system(size: 20, weight: .semibold))
                                        .foregroundColor(.blue)
                                    Text("protein")
                                        .font(.caption)
                                        .foregroundColor(.calTextSecondary)
                                }
                                .frame(maxWidth: .infinity)

                                VStack {
                                    Text("\(Int(totalCarbs))g")
                                        .font(.system(size: 20, weight: .semibold))
                                        .foregroundColor(.green)
                                    Text("carbs")
                                        .font(.caption)
                                        .foregroundColor(.calTextSecondary)
                                }
                                .frame(maxWidth: .infinity)

                                VStack {
                                    Text("\(Int(totalFat))g")
                                        .font(.system(size: 20, weight: .semibold))
                                        .foregroundColor(.yellow)
                                    Text("fat")
                                        .font(.caption)
                                        .foregroundColor(.calTextSecondary)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                        .padding()
                        .calCard()
                        .padding(.horizontal)
                    }

                    // Individual items
                    VStack(spacing: 16) {
                        HStack {
                            Text("\(detectedItems.count) Food Items Detected")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.calTextPrimary)

                            Spacer()

                            Text("\(selectedItemsArray.count) selected")
                                .font(.caption)
                                .foregroundColor(.calTextSecondary)
                        }
                        .padding(.horizontal)

                        ForEach(detectedItems.indices, id: \.self) { index in
                            VoiceFoodItemRow(
                                item: $detectedItems[index],
                                isLoading: isLoadingNutrition
                            )
                        }
                    }

                    // Action buttons
                    VStack(spacing: 12) {
                        Button(action: confirmSelection) {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                Text(isLoadingNutrition ? "Loading nutrition..." : "Log \(selectedItemsArray.count) Items")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(
                                    colors: [.calPrimary, .calSecondary],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(16)
                        }
                        .disabled(selectedItemsArray.isEmpty || isLoadingNutrition)
                        .opacity(selectedItemsArray.isEmpty ? 0.5 : 1.0)

                        Button(action: {
                            onCancel()
                            dismiss()
                        }) {
                            Text("Cancel")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .foregroundColor(.calTextSecondary)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        onCancel()
                        dismiss()
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.calTextSecondary)
                    }
                }
            }
        }
        .onAppear {
            fetchNutritionForAllItems()
        }
    }

    private func fetchNutritionForAllItems() {
        isLoadingNutrition = true

        Task {
            let foodSearch = SimpleFoodSearchService.shared

            // Fetch nutrition for each item in parallel
            await withTaskGroup(of: (Int, SimpleFood?).self) { group in
                for (index, item) in detectedItems.enumerated() {
                    group.addTask {
                        await foodSearch.searchFood(query: item.foodName)
                        // Access searchResults on MainActor
                        return await MainActor.run {
                            (index, foodSearch.searchResults.first)
                        }
                    }
                }

                // Collect results
                for await (index, result) in group {
                    await MainActor.run {
                        if index < detectedItems.count {
                            detectedItems[index].searchResult = result
                        }
                    }
                }
            }

            await MainActor.run {
                isLoadingNutrition = false
            }
        }
    }

    private func confirmSelection() {
        let itemsToLog = selectedItemsArray
        onConfirm(itemsToLog)
        dismiss()
    }
}

// Individual food item row for voice confirmation
struct VoiceFoodItemRow: View {
    @Binding var item: VoiceDetectedFoodItem
    let isLoading: Bool

    var body: some View {
        HStack(spacing: 12) {
            // Selection checkbox
            Button(action: {
                item.isSelected.toggle()
                let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                impactFeedback.impactOccurred()
            }) {
                Image(systemName: item.isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundColor(item.isSelected ? .calPrimary : .gray.opacity(0.3))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(item.displayName)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.calTextPrimary)

                if isLoading {
                    HStack(spacing: 4) {
                        ProgressView()
                            .scaleEffect(0.7)
                        Text("Fetching nutrition...")
                            .font(.caption)
                            .foregroundColor(.calTextSecondary)
                    }
                } else if let result = item.searchResult {
                    HStack(spacing: 12) {
                        Label("\(result.calories) cal", systemImage: "flame.fill")
                            .font(.caption)
                            .foregroundColor(.orange)

                        Label("\(Int(result.protein))g", systemImage: "circle.fill")
                            .font(.caption)
                            .foregroundColor(.blue)

                        Label("\(Int(result.carbs))g", systemImage: "leaf.fill")
                            .font(.caption)
                            .foregroundColor(.green)

                        Label("\(Int(result.fat))g", systemImage: "drop.fill")
                            .font(.caption)
                            .foregroundColor(.yellow)
                    }
                } else {
                    Text("Nutrition data not available")
                        .font(.caption)
                        .foregroundColor(.red.opacity(0.7))
                }
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(uiColor: .systemBackground))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(item.isSelected ? Color.calPrimary.opacity(0.3) : Color.gray.opacity(0.2), lineWidth: item.isSelected ? 2 : 1)
                )
        )
        .padding(.horizontal)
        .opacity(item.isSelected ? 1.0 : 0.6)
    }
}



// Removed duplicate FoodSearchSheet - it's defined later in the file

// Profile View
struct ProfileView: View {
    @EnvironmentObject var profileManager: UserProfileManager
    @EnvironmentObject var dataManager: MealDataManager
    @State private var showingEditSheet = false
    
    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Glass Navigation Bar
                    Text("PROFILE")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.calTextPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                    
                    // Profile Header with glass effect
                    profileHeader
                    
                    // Goals Section with glass effect
                    goalsSection
                    
                    // Stats Section with glass effect
                    statsSection
                    
                    // Body Metrics with glass effect
                    bodyMetricsSection
                    
                    // Settings Section with glass effect
                    settingsSection
                }
                .padding()
            }
            .sheet(isPresented: $showingEditSheet) {
                EditProfileSheet()
                    .environmentObject(profileManager)
            }
        }
    }
    
    private var profileHeader: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 100, height: 100)
                    .overlay(
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.5),
                                        Color.white.opacity(0.1)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.white)
            }
            
            Text(profileManager.userName.isEmpty ? "User" : profileManager.userName)
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Button("Edit Profile") {
                showingEditSheet = true
            }
            .calPrimaryButton()
        }
        .frame(maxWidth: .infinity)
        .padding()
        .calCard()
    }
    
    private var goalsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Daily Goals")
                .font(.headline)
                .foregroundColor(.white)
            
            GoalRow(icon: "flame.fill", label: "Calories", value: "\(profileManager.calorieGoal)", color: .orange)
            GoalRow(icon: "p.circle.fill", label: "Protein", value: "\(Int(profileManager.proteinGoal))g", color: .red)
            GoalRow(icon: "c.circle.fill", label: "Carbs", value: "\(Int(profileManager.carbsGoal))g", color: .blue)
            GoalRow(icon: "f.circle.fill", label: "Fat", value: "\(Int(profileManager.fatGoal))g", color: .green)
        }
        .padding()
        .calCard()
    }
    
    private var statsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Today's Progress")
                .font(.headline)
                .foregroundColor(.white)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("Meals Logged")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                    Text("\(dataManager.todaysMeals.count)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                Spacer()
                VStack(alignment: .trailing) {
                    Text("Total Calories")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                    Text("\(dataManager.totalCalories)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
        .calCard()
    }
    
    private var bodyMetricsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Body Metrics")
                .font(.headline)
                .foregroundColor(.white)
            
            HStack {
                MetricBox(label: "Weight", value: "\(Int(profileManager.weight)) kg", icon: "scalemass.fill")
                MetricBox(label: "Height", value: "\(Int(profileManager.height)) cm", icon: "ruler.fill")
                MetricBox(label: "Age", value: "\(profileManager.age)", icon: "calendar")
            }
            
            HStack {
                Label(profileManager.gender, systemImage: "person.fill")
                    .font(.subheadline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(.ultraThinMaterial)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            )
                    )
                
                Label(profileManager.activityLevel, systemImage: "figure.run")
                    .font(.subheadline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(.ultraThinMaterial)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            )
                    )
            }
        }
        .padding()
        .calCard()
    }
    
    private var settingsSection: some View {
        VStack(spacing: 12) {
            SettingsRow(icon: "square.and.arrow.up", label: "Export Data", action: exportData)
            SettingsRow(icon: "trash", label: "Clear All Data", action: clearData)
            SettingsRow(icon: "questionmark.circle", label: "About SCAL", action: showAbout)
        }
        .padding()
        .calCard()
    }
    
    private func exportData() {
        // Export functionality would go here
        print("Export data")
    }
    
    private func clearData() {
        // Clear data functionality
        print("Clear data")
    }
    
    private func showAbout() {
        // Show about screen
        print("Show about")
    }
}

// GoalRow removed - using SCAL version defined earlier

struct MetricBox: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.white)
            Text(value)
                .font(.headline)
                .foregroundColor(.white)
            Text(label)
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
        )
    }
}

struct SettingsRow: View {
    let icon: String
    let label: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.white)
                    .frame(width: 30)
                Text(label)
                    .foregroundColor(.white)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
            }
        }
    }
}

// Edit Profile Sheet
struct EditProfileSheet: View {
    @EnvironmentObject var profileManager: UserProfileManager
    @Environment(\.dismiss) var dismiss
    
    @State private var userName: String = ""
    @State private var calorieGoal: String = ""
    @State private var proteinGoal: String = ""
    @State private var carbsGoal: String = ""
    @State private var fatGoal: String = ""
    @State private var weight: String = ""
    @State private var height: String = ""
    @State private var age: String = ""
    @State private var selectedGender: String = "Other"
    @State private var selectedActivity: String = "Moderate"
    
    let genderOptions = ["Male", "Female", "Other"]
    let activityOptions = ["Sedentary", "Light", "Moderate", "Active", "Very Active"]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Personal Info") {
                    TextField("Name", text: $userName)
                    TextField("Age", text: $age)
                        .keyboardType(.numberPad)
                    
                    Picker("Gender", selection: $selectedGender) {
                        ForEach(genderOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                }
                
                Section("Body Metrics") {
                    TextField("Weight (kg)", text: $weight)
                        .keyboardType(.decimalPad)
                    TextField("Height (cm)", text: $height)
                        .keyboardType(.numberPad)
                    
                    Picker("Activity Level", selection: $selectedActivity) {
                        ForEach(activityOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                }
                
                Section("Daily Goals") {
                    TextField("Calorie Goal", text: $calorieGoal)
                        .keyboardType(.numberPad)
                    TextField("Protein Goal (g)", text: $proteinGoal)
                        .keyboardType(.decimalPad)
                    TextField("Carbs Goal (g)", text: $carbsGoal)
                        .keyboardType(.decimalPad)
                    TextField("Fat Goal (g)", text: $fatGoal)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveProfile()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .onAppear {
            loadCurrentValues()
        }
    }
    
    private func loadCurrentValues() {
        userName = profileManager.userName
        calorieGoal = String(profileManager.calorieGoal)
        proteinGoal = String(Int(profileManager.proteinGoal))
        carbsGoal = String(Int(profileManager.carbsGoal))
        fatGoal = String(Int(profileManager.fatGoal))
        weight = String(Int(profileManager.weight))
        height = String(Int(profileManager.height))
        age = String(profileManager.age)
        selectedGender = profileManager.gender
        selectedActivity = profileManager.activityLevel
    }
    
    private func saveProfile() {
        profileManager.userName = userName
        profileManager.calorieGoal = Int(calorieGoal) ?? 2000
        profileManager.proteinGoal = Double(proteinGoal) ?? 50
        profileManager.carbsGoal = Double(carbsGoal) ?? 250
        profileManager.fatGoal = Double(fatGoal) ?? 65
        profileManager.weight = Double(weight) ?? 70
        profileManager.height = Double(height) ?? 170
        profileManager.age = Int(age) ?? 25
        profileManager.gender = selectedGender
        profileManager.activityLevel = selectedActivity
        
        profileManager.saveProfile()
    }
}

// Onboarding View
struct OnboardingView: View {
    @ObservedObject var profileManager: UserProfileManager
    let onComplete: () -> Void
    
    @State private var currentPage = 0
    @State private var userName = ""
    @State private var age = ""
    @State private var weight = ""
    @State private var height = ""
    @State private var selectedGender = "Other"
    @State private var selectedActivity = "Moderate"
    @State private var calorieGoal = ""
    
    let genderOptions = ["Male", "Female", "Other"]
    let activityOptions = ["Sedentary", "Light", "Moderate", "Active", "Very Active"]
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack {
                // Progress indicator
                HStack(spacing: 8) {
                    ForEach(0..<4) { index in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(index <= currentPage ? Color.accentColor : Color.gray.opacity(0.3))
                            .frame(height: 4)
                    }
                }
                .padding(.horizontal, 40)
                .padding(.top, 60)
                
                // Content
                TabView(selection: $currentPage) {
                    welcomePage.tag(0)
                    personalInfoPage.tag(1)
                    bodyMetricsPage.tag(2)
                    goalsPage.tag(3)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                
                // Navigation buttons
                HStack {
                    if currentPage > 0 {
                        Button("Back") {
                            withAnimation {
                                currentPage -= 1
                            }
                        }
                        .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    Button(currentPage == 3 ? "Get Started" : "Next") {
                        if currentPage == 3 {
                            completeOnboarding()
                        } else {
                            withAnimation {
                                currentPage += 1
                            }
                        }
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.accentColor)
                    .cornerRadius(25)
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
            }
        }
        .preferredColorScheme(.dark)
    }
    
    private var welcomePage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Image(systemName: "camera.metering.center.weighted")
                .font(.system(size: 100))
                .foregroundColor(.accentColor)
            
            Text("Welcome to SCAL")
                .font(.largeTitle)
                .fontWeight(.black)
            
            Text("Smart Calorie Analysis Lens")
                .font(.title3)
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 20) {
                FeatureRow(icon: "camera.fill", text: "AI-powered food scanning", color: .calPrimary)
                FeatureRow(icon: "mic.fill", text: "Voice-based meal logging", color: .calAccent)
                FeatureRow(icon: "chart.bar.fill", text: "Real-time nutrition tracking", color: .blue)
                FeatureRow(icon: "message.fill", text: "Personal AI coach", color: .calSecondary)
            }
            .padding(.top, 40)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private var personalInfoPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Text("Let's get to know you")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack(spacing: 20) {
                TextField("Your name", text: $userName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(.title3)
                
                TextField("Age", text: $age)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.numberPad)
                    .font(.title3)
                
                VStack(alignment: .leading) {
                    Text("Gender")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    Picker("Gender", selection: $selectedGender) {
                        ForEach(genderOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .padding(.horizontal, 20)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private var bodyMetricsPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Text("Your body metrics")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack(spacing: 20) {
                HStack(spacing: 20) {
                    VStack(alignment: .leading) {
                        Text("Weight (kg)")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        TextField("70", text: $weight)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.decimalPad)
                            .font(.title3)
                    }
                    
                    VStack(alignment: .leading) {
                        Text("Height (cm)")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        TextField("170", text: $height)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.numberPad)
                            .font(.title3)
                    }
                }
                
                VStack(alignment: .leading) {
                    Text("Activity Level")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    Picker("Activity", selection: $selectedActivity) {
                        ForEach(activityOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    .pickerStyle(WheelPickerStyle())
                    .frame(height: 120)
                }
            }
            .padding(.horizontal, 20)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private var goalsPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Text("Set your daily goal")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack(spacing: 30) {
                VStack(alignment: .leading) {
                    Text("Daily calorie goal")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    TextField("2000", text: $calorieGoal)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.numberPad)
                        .font(.title3)
                }
                
                Text("We'll calculate your macro goals based on your profile")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                
                VStack(spacing: 16) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Personalized nutrition tracking")
                            .font(.subheadline)
                        Spacer()
                    }
                    
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("AI-powered meal suggestions")
                            .font(.subheadline)
                        Spacer()
                    }
                    
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Real USDA nutrition data")
                            .font(.subheadline)
                        Spacer()
                    }
                }
                .padding(.top, 20)
            }
            .padding(.horizontal, 20)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private func completeOnboarding() {
        // Save profile data
        profileManager.userName = userName.isEmpty ? "User" : userName
        profileManager.age = Int(age) ?? 25
        profileManager.weight = Double(weight) ?? 70
        profileManager.height = Double(height) ?? 170
        profileManager.gender = selectedGender
        profileManager.activityLevel = selectedActivity
        
        // Calculate goals based on profile
        let calculatedCalories = calculateCalorieGoal()
        profileManager.calorieGoal = Int(calorieGoal) ?? calculatedCalories
        
        // Calculate macros (40% carbs, 30% protein, 30% fat)
        let calories = Double(profileManager.calorieGoal)
        profileManager.carbsGoal = (calories * 0.4) / 4 // 4 cal per gram
        profileManager.proteinGoal = (calories * 0.3) / 4 // 4 cal per gram
        profileManager.fatGoal = (calories * 0.3) / 9 // 9 cal per gram
        
        profileManager.saveProfile()
        onComplete()
    }
    
    private func calculateCalorieGoal() -> Int {
        // Basic BMR calculation (Mifflin-St Jeor)
        let weightKg = Double(weight) ?? 70
        let heightCm = Double(height) ?? 170
        let ageYears = Double(age) ?? 25
        
        var bmr: Double
        if selectedGender == "Male" {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + 5
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) - 161
        }
        
        // Activity multiplier
        let activityMultiplier: Double
        switch selectedActivity {
        case "Sedentary": activityMultiplier = 1.2
        case "Light": activityMultiplier = 1.375
        case "Moderate": activityMultiplier = 1.55
        case "Active": activityMultiplier = 1.725
        case "Very Active": activityMultiplier = 1.9
        default: activityMultiplier = 1.55
        }
        
        return Int(bmr * activityMultiplier)
    }
}

// FeatureRow removed - using updated SCAL version defined later

// Food Search Sheet
struct FoodSearchSheet: View {
    @Binding var searchText: String
    @Binding var selectedFood: SimpleFood?
    let onSelect: (SimpleFood) -> Void
    @Environment(\.dismiss) var dismiss
    @StateObject private var foodSearch = SimpleFoodSearchService.shared
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Search food...", text: $searchText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .onSubmit {
                            searchFood()
                        }
                }
                .padding(.horizontal)
                
                if foodSearch.isSearching {
                    Spacer()
                    ProgressView("Searching...")
                        .padding()
                    Spacer()
                } else if foodSearch.searchResults.isEmpty && !searchText.isEmpty {
                    Spacer()
                    Text("No results found")
                        .foregroundColor(.secondary)
                    Spacer()
                } else {
                    List(foodSearch.searchResults) { food in
                        Button(action: {
                            selectedFood = food
                            onSelect(food)
                        }) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(food.name)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                if let brand = food.brand {
                                    Text(brand)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                HStack {
                                    Text("\(Int(food.calories)) cal")
                                        .font(.subheadline)
                                        .foregroundColor(.orange)
                                    Text("•")
                                        .foregroundColor(.secondary)
                                    Text("P: \(Int(food.protein))g")
                                        .font(.caption)
                                    Text("C: \(Int(food.carbs))g")
                                        .font(.caption)
                                    Text("F: \(Int(food.fat))g")
                                        .font(.caption)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle("Search Food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            if !searchText.isEmpty {
                searchFood()
            }
        }
    }
    
    private func searchFood() {
        Task {
            await foodSearch.searchFood(query: searchText)
        }
    }
}

// Live Barcode Scanner View with AVCaptureSession
struct BarcodeScannerView: View {
    let onScan: (String) -> Void
    @Environment(\.dismiss) var dismiss
    @State private var scannedCode: String = ""
    @State private var torchOn = false
    @State private var showManualEntry = false
    @State private var isScanning = true
    @State private var lastScannedCode = ""
    
    var body: some View {
        NavigationView {
            ZStack {
                // Live camera view
                CameraPreview(
                    scannedCode: $scannedCode,
                    torchOn: $torchOn,
                    isScanning: $isScanning
                )
                .ignoresSafeArea()
                
                // Overlay UI
                VStack {
                    Spacer()
                    
                    // Scanner frame with animated corners
                    ZStack {
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.calPrimary, lineWidth: 3)
                            .frame(width: 280, height: 140)
                        
                        // Animated scanning line
                        Rectangle()
                            .fill(Color.calPrimary.opacity(0.5))
                            .frame(width: 260, height: 2)
                            .offset(y: isScanning ? -60 : 60)
                            .animation(
                                Animation.easeInOut(duration: 1.5)
                                    .repeatForever(autoreverses: true),
                                value: isScanning
                            )
                    }
                    
                    Text("Position barcode in frame")
                        .font(.subheadline)
                        .foregroundColor(.white)
                        .padding(8)
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(8)
                        .padding(.top, 20)
                    
                    Spacer()
                    
                    // Manual entry option
                    Button(action: { showManualEntry.toggle() }) {
                        Label("Enter manually", systemImage: "keyboard")
                            .font(.subheadline)
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Color.black.opacity(0.7))
                            .cornerRadius(20)
                    }
                    .padding(.bottom, 50)
                }
            }
            .navigationTitle("Scan Barcode")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.calPrimary)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        torchOn.toggle()
                        // Haptic feedback
                        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                        impactFeedback.impactOccurred()
                    }) {
                        Image(systemName: torchOn ? "flashlight.on.fill" : "flashlight.off.fill")
                            .foregroundColor(torchOn ? .calAccent : .calPrimary)
                    }
                }
            }
            .sheet(isPresented: $showManualEntry) {
                ManualBarcodeEntry(onScan: onScan)
            }
            .onChange(of: scannedCode) { _, newCode in
                if !newCode.isEmpty && newCode != lastScannedCode {
                    lastScannedCode = newCode
                    // Haptic feedback on successful scan
                    let notificationFeedback = UINotificationFeedbackGenerator()
                    notificationFeedback.notificationOccurred(.success)

                    // Slight delay to show the code was captured
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        onScan(newCode)
                    }
                }
            }
        }
        // Dark mode now supported in barcode scanner
    }
}

// Camera Preview for barcode scanning
struct CameraPreview: UIViewRepresentable {
    @Binding var scannedCode: String
    @Binding var torchOn: Bool
    @Binding var isScanning: Bool
    
    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: UIScreen.main.bounds)
        let coordinator = context.coordinator
        
        coordinator.setupCaptureSession()
        
        if let previewLayer = coordinator.previewLayer {
            view.layer.addSublayer(previewLayer)
            previewLayer.frame = view.bounds
        }
        
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
        context.coordinator.updateTorch(torchOn)
        
        if let previewLayer = context.coordinator.previewLayer {
            previewLayer.frame = uiView.bounds
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, AVCaptureMetadataOutputObjectsDelegate {
        let parent: CameraPreview
        var captureSession: AVCaptureSession?
        var previewLayer: AVCaptureVideoPreviewLayer?
        
        init(_ parent: CameraPreview) {
            self.parent = parent
        }
        
        func setupCaptureSession() {
            let captureSession = AVCaptureSession()
            self.captureSession = captureSession
            
            guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else { return }
            
            let videoInput: AVCaptureDeviceInput
            do {
                videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
            } catch {
                return
            }
            
            if captureSession.canAddInput(videoInput) {
                captureSession.addInput(videoInput)
            } else {
                return
            }
            
            let metadataOutput = AVCaptureMetadataOutput()
            
            if captureSession.canAddOutput(metadataOutput) {
                captureSession.addOutput(metadataOutput)
                
                metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
                // Support common barcode types
                metadataOutput.metadataObjectTypes = [
                    .ean8, .ean13, .pdf417, .qr, .upce,
                    .code39, .code39Mod43, .code93, .code128,
                    .interleaved2of5, .itf14
                ]
            } else {
                return
            }
            
            previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
            previewLayer?.videoGravity = .resizeAspectFill
            
            DispatchQueue.global(qos: .userInitiated).async {
                captureSession.startRunning()
            }
        }
        
        func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
            if let metadataObject = metadataObjects.first {
                guard let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject else { return }
                guard let stringValue = readableObject.stringValue else { return }
                
                // Found a barcode
                parent.scannedCode = stringValue
                parent.isScanning = false
            }
        }
        
        func updateTorch(_ on: Bool) {
            guard let device = AVCaptureDevice.default(for: .video) else { return }
            
            if device.hasTorch {
                do {
                    try device.lockForConfiguration()
                    device.torchMode = on ? .on : .off
                    device.unlockForConfiguration()
                } catch {
                    print("Torch could not be used")
                }
            }
        }
    }
}

// Manual Barcode Entry Sheet
struct ManualBarcodeEntry: View {
    let onScan: (String) -> Void
    @Environment(\.dismiss) var dismiss
    @State private var barcodeText = ""
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Enter Barcode Number")
                    .font(.headline)
                    .padding(.top, 30)
                
                TextField("Barcode (UPC/EAN)", text: $barcodeText)
                    .font(.system(size: 24, weight: .medium, design: .monospaced))
                    .multilineTextAlignment(.center)
                    .keyboardType(.numberPad)
                    .focused($isTextFieldFocused)
                    .padding()
                    .background(Color.calBackground)
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .onSubmit {
                        if !barcodeText.isEmpty {
                            onScan(barcodeText)
                            dismiss()
                        }
                    }
                
                Text("Enter the numbers below the barcode")
                    .font(.caption)
                    .foregroundColor(.calTextSecondary)
                
                Spacer()
                
                Button(action: {
                    if !barcodeText.isEmpty {
                        onScan(barcodeText)
                        dismiss()
                    }
                }) {
                    Text("Search")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(barcodeText.isEmpty ? Color.gray : Color.calPrimary)
                        .cornerRadius(12)
                        .padding(.horizontal)
                }
                .disabled(barcodeText.isEmpty)
            }
            .navigationTitle("Manual Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            isTextFieldFocused = true
        }
    }
}

// Celebration View for goal achievements
struct CelebrationView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "party.popper.fill")
                .font(.system(size: 50))
                .foregroundColor(.yellow)
                .scaleEffect(1.2)
                .animation(.easeInOut(duration: 0.6).repeatCount(3, autoreverses: true), value: message)
            
            Text(message)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.accentColor)
                .shadow(radius: 10)
        )
        .scaleEffect(1.1)
    }
}

// MARK: - SCAL Helper Views

// Date Picker View
struct CalDatePicker: View {
    @Binding var selectedDate: Date
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            DatePicker("Select Date", selection: $selectedDate, displayedComponents: .date)
                .datePickerStyle(GraphicalDatePickerStyle())
                .padding()
                .navigationTitle("Select Date")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") {
                            dismiss()
                        }
                        .foregroundColor(.calPrimary)
                    }
                }
        }
    }
}

// Food Search View
struct CalFoodSearchView: View {
    let onSelect: (SimpleFood) -> Void
    @Environment(\.dismiss) var dismiss
    @State private var searchText = ""
    @StateObject private var foodSearch = SimpleFoodSearchService.shared
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.calTextSecondary)
                    
                    TextField("Search food...", text: $searchText)
                        .font(.system(size: 16))
                        .onSubmit {
                            searchFood()
                        }
                }
                .padding(12)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                .padding()
                
                // Results
                if foodSearch.isSearching {
                    Spacer()
                    ProgressView("Searching...")
                        .foregroundColor(.calTextSecondary)
                    Spacer()
                } else if foodSearch.searchResults.isEmpty && !searchText.isEmpty {
                    Spacer()
                    VStack(spacing: 16) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 48))
                            .foregroundColor(.calTextSecondary.opacity(0.5))
                        Text("No results found")
                            .foregroundColor(.calTextSecondary)
                    }
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(foodSearch.searchResults) { food in
                                Button(action: {
                                    onSelect(food)
                                    dismiss()
                                }) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(food.name)
                                                .font(.system(size: 16, weight: .medium))
                                                .foregroundColor(.calTextPrimary)
                                                .multilineTextAlignment(.leading)
                                            
                                            if let brand = food.brand {
                                                Text(brand)
                                                    .font(.system(size: 14))
                                                    .foregroundColor(.calTextSecondary)
                                            }
                                            
                                            HStack(spacing: 12) {
                                                Label("\(Int(food.calories))", systemImage: "flame.fill")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(.orange)
                                                
                                                Text("P: \(Int(food.protein))g")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(.calTextSecondary)
                                                
                                                Text("C: \(Int(food.carbs))g")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(.calTextSecondary)
                                                
                                                Text("F: \(Int(food.fat))g")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(.calTextSecondary)
                                            }
                                        }
                                        
                                        Spacer()
                                        
                                        Image(systemName: "plus.circle.fill")
                                            .font(.system(size: 24))
                                            .foregroundColor(.calPrimary)
                                    }
                                    .padding(16)
                                    .background(Color.white)
                                    .cornerRadius(12)
                                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .background(Color.calBackground)
            .navigationTitle("Search Food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.calPrimary)
                }
            }
        }
        .onAppear {
            if !searchText.isEmpty {
                searchFood()
            }
        }
    }
    
    private func searchFood() {
        Task {
            await foodSearch.searchFood(query: searchText)
        }
    }
}

// MARK: - SCAL Onboarding
struct CalOnboardingView: View {
    @ObservedObject var profileManager: UserProfileManager
    let onComplete: () -> Void
    
    @State private var currentPage = 0
    @State private var userName = ""
    @State private var age = ""
    @State private var weight = ""
    @State private var height = ""
    @State private var selectedGender = "Other"
    @State private var selectedActivity = "Moderate"
    @State private var calorieGoal = ""
    @State private var selectedGoal = "maintain"
    
    let genderOptions = ["Male", "Female", "Other"]
    let activityOptions = ["Sedentary", "Light", "Moderate", "Active", "Very Active"]
    
    var body: some View {
        ZStack {
            Color.calBackground.ignoresSafeArea()
            
            VStack {
                // Progress indicator
                HStack(spacing: 8) {
                    ForEach(0..<5) { index in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(index <= currentPage ? Color.calPrimary : Color.gray.opacity(0.3))
                            .frame(height: 4)
                    }
                }
                .padding(.horizontal, 40)
                .padding(.top, 60)
                
                // Content
                TabView(selection: $currentPage) {
                    welcomePage.tag(0)
                    lifestylePage.tag(1)
                    personalInfoPage.tag(2)
                    bodyMetricsPage.tag(3)
                    goalsPage.tag(4)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                
                // Navigation buttons
                HStack {
                    if currentPage > 0 {
                        Button("Back") {
                            withAnimation {
                                currentPage -= 1
                            }
                        }
                        .foregroundColor(.calTextSecondary)
                    }
                    
                    Spacer()
                    
                    Button(currentPage == 4 ? "Start Tracking" : "Continue") {
                        if currentPage == 4 {
                            completeOnboarding()
                        } else {
                            withAnimation {
                                currentPage += 1
                            }
                        }
                    }
                    .calPrimaryButton()
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
            }
        }
    }
    
    private var welcomePage: some View {
        VStack(spacing: 40) {
            Spacer()
            
            Image(systemName: "leaf.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.calPrimary)
                .symbolRenderingMode(.hierarchical)
            
            VStack(spacing: 16) {
                Text("Welcome to SCAL")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(.calTextPrimary)
                
                Text("Your intelligent nutrition companion")
                    .font(.system(size: 18))
                    .foregroundColor(.calTextSecondary)
                    .multilineTextAlignment(.center)
            }
            
            VStack(spacing: 24) {
                FeatureRow(icon: "camera.fill", text: "Snap photos for instant calorie tracking", color: .calPrimary)
                FeatureRow(icon: "brain", text: "AI-powered nutrition insights", color: .calAccent)
                FeatureRow(icon: "chart.line.uptrend.xyaxis", text: "Track progress towards your goals", color: .blue)
            }
            .padding(.top, 20)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private var lifestylePage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            VStack(spacing: 16) {
                Text("What brings you to SCAL?")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                    .multilineTextAlignment(.center)
                
                Text("This helps us personalize your experience")
                    .font(.system(size: 16))
                    .foregroundColor(.calTextSecondary)
            }
            
            VStack(spacing: 16) {
                LifestyleOption(title: "Lose Weight", icon: "arrow.down.circle.fill", isSelected: selectedGoal == "lose")
                    .onTapGesture { selectedGoal = "lose" }
                
                LifestyleOption(title: "Maintain Weight", icon: "equal.circle.fill", isSelected: selectedGoal == "maintain")
                    .onTapGesture { selectedGoal = "maintain" }
                
                LifestyleOption(title: "Gain Muscle", icon: "arrow.up.circle.fill", isSelected: selectedGoal == "gain")
                    .onTapGesture { selectedGoal = "gain" }
                
                LifestyleOption(title: "Be Healthier", icon: "heart.circle.fill", isSelected: selectedGoal == "health")
                    .onTapGesture { selectedGoal = "health" }
            }
            .padding(.top, 20)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private var personalInfoPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Text("Tell us about yourself")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Name")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.calTextSecondary)
                    TextField("Your name", text: $userName)
                        .font(.system(size: 16))
                        .padding(12)
                        .background(Color.white)
                        .cornerRadius(10)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Age")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.calTextSecondary)
                    TextField("Your age", text: $age)
                        .font(.system(size: 16))
                        .keyboardType(.numberPad)
                        .padding(12)
                        .background(Color.white)
                        .cornerRadius(10)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Gender")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.calTextSecondary)
                    
                    HStack(spacing: 12) {
                        ForEach(genderOptions, id: \.self) { option in
                            Button(action: { selectedGender = option }) {
                                Text(option)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(selectedGender == option ? .white : .calTextPrimary)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(selectedGender == option ? Color.calPrimary : Color.white)
                                    .cornerRadius(10)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private var bodyMetricsPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Text("Your body metrics")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            VStack(spacing: 20) {
                HStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Weight (kg)")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.calTextSecondary)
                        TextField("70", text: $weight)
                            .font(.system(size: 16))
                            .keyboardType(.decimalPad)
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(10)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Height (cm)")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.calTextSecondary)
                        TextField("170", text: $height)
                            .font(.system(size: 16))
                            .keyboardType(.numberPad)
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(10)
                    }
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Activity Level")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.calTextSecondary)
                    
                    ForEach(activityOptions, id: \.self) { option in
                        Button(action: { selectedActivity = option }) {
                            HStack {
                                Text(option)
                                    .font(.system(size: 16))
                                    .foregroundColor(.calTextPrimary)
                                Spacer()
                                if selectedActivity == option {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.calPrimary)
                                }
                            }
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(10)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private var goalsPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            Text("Your personalized plan")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.calTextPrimary)
            
            VStack(spacing: 30) {
                // Calorie recommendation
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.calPrimary)
                    
                    Text("Based on your profile")
                        .font(.system(size: 16))
                        .foregroundColor(.calTextSecondary)
                    
                    Text("We recommend")
                        .font(.system(size: 18))
                        .foregroundColor(.calTextPrimary)
                    
                    Text("\(calculateCalorieGoal())")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundColor(.calPrimary)
                    
                    Text("calories per day")
                        .font(.system(size: 18))
                        .foregroundColor(.calTextPrimary)
                }
                
                VStack(spacing: 16) {
                    FeatureCheckmark(text: "Personalized macro targets")
                    FeatureCheckmark(text: "AI-powered meal suggestions")
                    FeatureCheckmark(text: "Weekly progress insights")
                }
                .padding(.top, 20)
            }
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    private func completeOnboarding() {
        // Save profile data
        profileManager.userName = userName.isEmpty ? "User" : userName
        profileManager.age = Int(age) ?? 25
        profileManager.weight = Double(weight) ?? 70
        profileManager.height = Double(height) ?? 170
        profileManager.gender = selectedGender
        profileManager.activityLevel = selectedActivity
        
        // Calculate goals
        let calculatedCalories = calculateCalorieGoal()
        profileManager.calorieGoal = calculatedCalories
        
        // Calculate macros based on goal
        let calories = Double(calculatedCalories)
        switch selectedGoal {
        case "lose":
            profileManager.proteinGoal = (calories * 0.35) / 4
            profileManager.carbsGoal = (calories * 0.35) / 4
            profileManager.fatGoal = (calories * 0.30) / 9
        case "gain":
            profileManager.proteinGoal = (calories * 0.30) / 4
            profileManager.carbsGoal = (calories * 0.45) / 4
            profileManager.fatGoal = (calories * 0.25) / 9
        default: // maintain or health
            profileManager.proteinGoal = (calories * 0.30) / 4
            profileManager.carbsGoal = (calories * 0.40) / 4
            profileManager.fatGoal = (calories * 0.30) / 9
        }
        
        profileManager.saveProfile()
        onComplete()
    }
    
    private func calculateCalorieGoal() -> Int {
        let weightKg = Double(weight) ?? 70
        let heightCm = Double(height) ?? 170
        let ageYears = Double(age) ?? 25
        
        // BMR calculation
        var bmr: Double
        if selectedGender == "Male" {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + 5
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) - 161
        }
        
        // Activity multiplier
        let activityMultiplier: Double
        switch selectedActivity {
        case "Sedentary": activityMultiplier = 1.2
        case "Light": activityMultiplier = 1.375
        case "Moderate": activityMultiplier = 1.55
        case "Active": activityMultiplier = 1.725
        case "Very Active": activityMultiplier = 1.9
        default: activityMultiplier = 1.55
        }
        
        var tdee = bmr * activityMultiplier
        
        // Adjust based on goal
        switch selectedGoal {
        case "lose": tdee *= 0.85 // 15% deficit
        case "gain": tdee *= 1.1 // 10% surplus
        default: break // maintain or health - no adjustment
        }
        
        return Int(tdee)
    }
}

// Lifestyle Option Component
struct LifestyleOption: View {
    let title: String
    let icon: String
    let isSelected: Bool
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(isSelected ? .white : .calPrimary)
            
            Text(title)
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(isSelected ? .white : .calTextPrimary)
            
            Spacer()
            
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
            }
        }
        .padding(20)
        .background(isSelected ? Color.calPrimary : Color.white)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isSelected ? Color.clear : Color.gray.opacity(0.2), lineWidth: 1)
        )
    }
}

// Feature Checkmark Component
struct FeatureCheckmark: View {
    let text: String
    
    var body: some View {
        HStack {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.calPrimary)
            Text(text)
                .font(.system(size: 16))
                .foregroundColor(.calTextPrimary)
            Spacer()
        }
    }
}

// Updated Feature Row for onboarding
struct FeatureRow: View {
    let icon: String
    let text: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 28))
                .foregroundColor(color)
                .frame(width: 40)
            
            Text(text)
                .font(.system(size: 16))
                .foregroundColor(.calTextPrimary)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
    }
}

// MARK: - HealthKit Sync View
struct HealthKitSyncView: View {
    @StateObject private var healthKit = HealthKitManager.shared
    @Environment(\.dismiss) var dismiss
    @State private var showingSuccess = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                Spacer()
                
                // HealthKit icon
                Image(systemName: "heart.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.red)
                
                // Title
                Text("Connect to Apple Health")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.calTextPrimary)
                
                // Description
                Text("Sync your nutrition data with Apple Health to get a complete picture of your wellness journey")
                    .font(.system(size: 16))
                    .foregroundColor(.calTextSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                
                // Benefits
                VStack(spacing: 20) {
                    HealthBenefit(
                        icon: "arrow.triangle.2.circlepath",
                        title: "Two-way Sync",
                        description: "Automatically sync meals and read workout data"
                    )
                    
                    HealthBenefit(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "Complete Analytics",
                        description: "Combine nutrition with fitness data"
                    )
                    
                    HealthBenefit(
                        icon: "lock.shield.fill",
                        title: "Private & Secure",
                        description: "Your data stays on your device"
                    )
                }
                .padding(.horizontal, 30)
                
                Spacer()
                
                // Connect button
                Button(action: {
                    healthKit.requestAuthorization()
                    showingSuccess = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        dismiss()
                    }
                }) {
                    Text("Connect to Apple Health")
                        .font(.headline)
                }
                .calPrimaryButton()
                .padding(.horizontal, 40)
                
                // Skip button
                Button(action: { dismiss() }) {
                    Text("Maybe Later")
                        .font(.system(size: 16))
                        .foregroundColor(.calTextSecondary)
                }
                .padding(.bottom, 40)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.calTextSecondary)
                    }
                }
            }
        }
        .alert("Connected Successfully!", isPresented: $showingSuccess) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("SCAL is now syncing with Apple Health")
        }
    }
}

// Health Benefit Row
struct HealthBenefit: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(.calPrimary)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.calTextPrimary)
                
                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(.calTextSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppSettingsManager.shared)
        .environmentObject(MealNotificationManager.shared)
        .preferredColorScheme(.light)
}
