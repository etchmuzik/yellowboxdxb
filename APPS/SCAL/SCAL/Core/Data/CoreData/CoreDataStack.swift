import CoreData
import Foundation

class CoreDataStack {
    static let shared = CoreDataStack()
    
    private init() {}
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "SCAL")
        
        // Enable automatic migration
        let description = container.persistentStoreDescriptions.first
        description?.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
        description?.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
        
        container.loadPersistentStores { _, error in
            if let error = error as NSError? {
                // In production, handle this error appropriately
                fatalError("Core Data failed to load: \(error), \(error.userInfo)")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
        
        return container
    }()
    
    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }
    
    func newBackgroundContext() -> NSManagedObjectContext {
        persistentContainer.newBackgroundContext()
    }
    
    func save() {
        let context = viewContext
        
        guard context.hasChanges else { return }
        
        do {
            try context.save()
        } catch {
            let nsError = error as NSError
            fatalError("Core Data save failed: \(nsError), \(nsError.userInfo)")
        }
    }
    
    func saveContext(_ context: NSManagedObjectContext) {
        guard context.hasChanges else { return }
        
        do {
            try context.save()
        } catch {
            let nsError = error as NSError
            print("Core Data save failed: \(nsError), \(nsError.userInfo)")
        }
    }
}

// MARK: - Managed Object Subclasses

// CDFood
@objc(CDFood)
public class CDFood: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var brand: String?
    @NSManaged public var barcode: String?
    @NSManaged public var calories: Double
    @NSManaged public var protein: Double
    @NSManaged public var carbohydrates: Double
    @NSManaged public var fat: Double
    @NSManaged public var fiber: Double
    @NSManaged public var sugar: Double
    @NSManaged public var sodium: Double
    @NSManaged public var servingAmount: Double
    @NSManaged public var servingUnit: String
    @NSManaged public var recognitionConfidence: Double
    @NSManaged public var dataSource: String
    @NSManaged public var usdaFoodId: String?
    @NSManaged public var customServingSize: Double
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var meal: CDMeal?
}

// CDMeal
@objc(CDMeal)
public class CDMeal: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var mealType: String
    @NSManaged public var consumedAt: Date
    @NSManaged public var notes: String?
    @NSManaged public var locationName: String?
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var foods: NSOrderedSet
}

// CDUser
@objc(CDUser)
public class CDUser: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var email: String?
    @NSManaged public var age: Int16
    @NSManaged public var gender: String?
    @NSManaged public var height: Double
    @NSManaged public var weight: Double
    @NSManaged public var activityLevel: String
    @NSManaged public var dailyCalorieGoal: Int32
    @NSManaged public var proteinGoal: Double
    @NSManaged public var carbGoal: Double
    @NSManaged public var fatGoal: Double
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
}

// MARK: - Core Data Extensions

extension CDFood {
    static func fetchRequest() -> NSFetchRequest<CDFood> {
        return NSFetchRequest<CDFood>(entityName: "CDFood")
    }
    
    func toFood() -> Food {
        let nutrition = NutritionInfo(
            calories: calories,
            protein: protein,
            carbohydrates: carbohydrates,
            fat: fat,
            fiber: fiber > 0 ? fiber : nil,
            sugar: sugar > 0 ? sugar : nil,
            sodium: sodium > 0 ? sodium : nil
        )
        
        let servingSize = ServingSize(
            amount: servingAmount,
            unit: ServingUnit(rawValue: servingUnit) ?? .serving,
            gramsPerServing: nil
        )
        
        return Food(
            id: id,
            name: name,
            brand: brand,
            barcode: barcode,
            nutritionInfo: nutrition,
            servingSize: servingSize,
            recognitionConfidence: recognitionConfidence,
            imageData: nil,
            recognizedLabels: [],
            usdaFoodId: usdaFoodId,
            dataSource: DataSource(rawValue: dataSource) ?? .manual,
            customServingSize: customServingSize,
            notes: nil,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
}

extension CDMeal {
    static func fetchRequest() -> NSFetchRequest<CDMeal> {
        return NSFetchRequest<CDMeal>(entityName: "CDMeal")
    }
    
    func toMeal() -> Meal {
        let foodsArray = (foods.array as? [CDFood] ?? []).map { $0.toFood() }
        
        return Meal(
            id: id,
            name: name,
            foods: foodsArray,
            mealType: MealType(rawValue: mealType) ?? .other,
            consumedAt: consumedAt,
            notes: notes,
            locationName: locationName,
            latitude: latitude,
            longitude: longitude,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
}

extension CDUser {
    static func fetchRequest() -> NSFetchRequest<CDUser> {
        return NSFetchRequest<CDUser>(entityName: "CDUser")
    }
}