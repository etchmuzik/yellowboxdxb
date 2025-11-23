//
//  CloudKitManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  CloudKit synchronization manager for multi-device support
//

import CloudKit
import SwiftUI

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
            let results = try await privateDatabase.records(matching: query, inZoneWith: zoneID)
            
            let meals = results.matchResults.compactMap { _, result -> SimpleMeal? in
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