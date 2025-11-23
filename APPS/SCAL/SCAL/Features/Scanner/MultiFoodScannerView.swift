//
//  MultiFoodScannerView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Advanced multi-food scanning interface with ML detection
//

import SwiftUI
import PhotosUI

struct MultiFoodScannerView: View {
    @StateObject private var detector = MultiFoodDetector.shared
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedImage: UIImage?
    @State private var showingImagePicker = false
    @State private var showingCamera = false
    @State private var showingResults = false
    @State private var editMode = false
    @State private var selectedItems: Set<UUID> = []
    
    let onConfirm: (MealComposition) -> Void
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                SCALDesignSystem.Colors.background
                    .ignoresSafeArea()
                
                if let image = selectedImage {
                    // Image analysis view
                    imageAnalysisView(image: image)
                } else {
                    // Image selection view
                    imageSelectionView
                }
            }
            .navigationTitle("Multi-Food Scanner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
                
                if detector.detectedItems.count > 0 {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(editMode ? "Done" : "Edit") {
                            withAnimation {
                                editMode.toggle()
                                if !editMode {
                                    selectedItems.removeAll()
                                }
                            }
                        }
                        .foregroundColor(SCALDesignSystem.Colors.primary)
                    }
                }
            }
        }
        .sheet(isPresented: $showingImagePicker) {
            ImagePicker(image: $selectedImage, sourceType: .photoLibrary)
        }
        .sheet(isPresented: $showingCamera) {
            ImagePicker(image: $selectedImage, sourceType: .camera)
        }
        .sheet(isPresented: $showingResults) {
            if let composition = detector.mealComposition {
                MultiFoodResultsView(
                    composition: composition,
                    onConfirm: {
                        onConfirm(composition)
                        dismiss()
                    },
                    onRescan: {
                        selectedImage = nil
                        detector.detectedItems = []
                        detector.mealComposition = nil
                    }
                )
            }
        }
        .onChange(of: selectedImage) { _, newImage in
            if let image = newImage {
                analyzeImage(image)
            }
        }
    }
    
    // MARK: - Image Selection View
    
    private var imageSelectionView: some View {
        VStack(spacing: 40) {
            // Icon
            Image(systemName: "camera.metering.multispot")
                .font(.system(size: 80))
                .foregroundColor(SCALDesignSystem.Colors.primary)
                .symbolEffect(.pulse)
            
            // Title
            VStack(spacing: 8) {
                Text("Multi-Food Detection")
                    .font(SCALDesignSystem.Typography.title2)
                    .foregroundColor(SCALDesignSystem.Colors.primaryText)
                
                Text("Scan complex meals with multiple items")
                    .font(SCALDesignSystem.Typography.subheadline)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                    .multilineTextAlignment(.center)
            }
            
            // Premium badge
            if !subscriptionManager.hasAccess(to: .advancedFoodScanning) {
                PremiumBadge(tier: .premium, size: .medium)
            }
            
            // Action buttons
            VStack(spacing: 16) {
                PrimaryActionButton(
                    "Take Photo",
                    icon: "camera.fill"
                ) {
                    checkPremiumAndProceed {
                        showingCamera = true
                    }
                }
                
                SecondaryActionButton(
                    "Choose from Library",
                    icon: "photo.on.rectangle",
                    color: SCALDesignSystem.Colors.primary
                ) {
                    checkPremiumAndProceed {
                        showingImagePicker = true
                    }
                }
            }
            .padding(.horizontal, 40)
            
            // Features list
            VStack(alignment: .leading, spacing: 12) {
                FeatureRow(icon: "checkmark.circle.fill", text: "Detect multiple foods in one photo")
                FeatureRow(icon: "checkmark.circle.fill", text: "Individual nutrition for each item")
                FeatureRow(icon: "checkmark.circle.fill", text: "Edit and adjust portions")
                FeatureRow(icon: "checkmark.circle.fill", text: "95% accuracy with ML")
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(SCALDesignSystem.Colors.secondaryBackground)
            )
            .padding(.horizontal)
        }
    }
    
    // MARK: - Image Analysis View
    
    private func imageAnalysisView(image: UIImage) -> some View {
        VStack(spacing: 0) {
            // Image with overlays
            GeometryReader { geometry in
                ZStack {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: geometry.size.width)
                    
                    // Detection overlays
                    if !detector.isProcessing {
                        ForEach(detector.detectedItems) { item in
                            FoodDetectionOverlay(
                                item: item,
                                imageSize: image.size,
                                viewSize: geometry.size,
                                isSelected: selectedItems.contains(item.id),
                                editMode: editMode
                            ) {
                                if editMode {
                                    toggleSelection(item.id)
                                }
                            }
                        }
                    }
                    
                    // Processing overlay
                    if detector.isProcessing {
                        processingOverlay
                    }
                }
            }
            .aspectRatio(4/3, contentMode: .fit)
            .background(Color.black)
            .cornerRadius(12)
            
            // Results section
            if !detector.isProcessing && detector.detectedItems.count > 0 {
                resultsSection
            }
        }
    }
    
    private var processingOverlay: some View {
        ZStack {
            Color.black.opacity(0.7)
            
            VStack(spacing: 24) {
                // Progress indicator
                ProgressView(value: detector.processingProgress)
                    .progressViewStyle(CircularProgressViewStyle(tint: SCALDesignSystem.Colors.primary))
                    .scaleEffect(2)
                
                // Status text
                Text(detector.currentStep.rawValue)
                    .font(SCALDesignSystem.Typography.headline)
                    .foregroundColor(.white)
                
                // Progress percentage
                Text("\(Int(detector.processingProgress * 100))%")
                    .font(SCALDesignSystem.Typography.caption)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.black.opacity(0.8))
            )
        }
    }
    
    private var resultsSection: some View {
        VStack(spacing: 16) {
            // Summary header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(detector.detectedItems.count) items detected")
                        .font(SCALDesignSystem.Typography.headline)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    if let composition = detector.mealComposition {
                        Text("\(composition.totalCalories) total calories")
                            .font(SCALDesignSystem.Typography.subheadline)
                            .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                    }
                }
                
                Spacer()
                
                if editMode && selectedItems.count > 0 {
                    Button(action: deleteSelectedItems) {
                        Label("Delete", systemImage: "trash")
                            .font(SCALDesignSystem.Typography.caption)
                            .foregroundColor(.red)
                    }
                }
            }
            .padding(.horizontal)
            
            // Detected items list
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(detector.detectedItems) { item in
                        DetectedFoodRow(
                            item: item,
                            isSelected: selectedItems.contains(item.id),
                            editMode: editMode
                        ) {
                            if editMode {
                                toggleSelection(item.id)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            // Action buttons
            HStack(spacing: 12) {
                SecondaryActionButton(
                    "Rescan",
                    icon: "arrow.clockwise",
                    color: .gray
                ) {
                    selectedImage = nil
                    detector.detectedItems = []
                }
                
                PrimaryActionButton(
                    "Add to Log",
                    icon: "checkmark.circle.fill"
                ) {
                    showingResults = true
                }
                .disabled(detector.detectedItems.isEmpty)
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
    }
    
    // MARK: - Helper Methods
    
    private func checkPremiumAndProceed(action: @escaping () -> Void) {
        if subscriptionManager.hasAccess(to: .advancedFoodScanning) {
            action()
        } else {
            subscriptionManager.requestFeatureAccess(.advancedFoodScanning)
        }
    }
    
    private func analyzeImage(_ image: UIImage) {
        Task {
            do {
                _ = try await detector.detectFoodsInImage(image)
            } catch {
                // Handle error
                print("Detection error: \(error)")
            }
        }
    }
    
    private func toggleSelection(_ id: UUID) {
        withAnimation(.easeInOut(duration: 0.2)) {
            if selectedItems.contains(id) {
                selectedItems.remove(id)
            } else {
                selectedItems.insert(id)
            }
        }
    }
    
    private func deleteSelectedItems() {
        withAnimation {
            detector.detectedItems.removeAll { selectedItems.contains($0.id) }
            selectedItems.removeAll()
            
            // Recalculate composition
            if let composition = detector.mealComposition {
                detector.mealComposition = MealComposition(
                    items: detector.detectedItems,
                    totalCalories: detector.detectedItems.reduce(0) { $0 + $1.calories },
                    totalProtein: detector.detectedItems.reduce(0) { $0 + ($1.nutritionInfo?.protein ?? 0) },
                    totalCarbs: detector.detectedItems.reduce(0) { $0 + ($1.nutritionInfo?.carbs ?? 0) },
                    totalFat: detector.detectedItems.reduce(0) { $0 + ($1.nutritionInfo?.fat ?? 0) },
                    mealType: composition.mealType,
                    confidence: composition.confidence
                )
            }
        }
    }
}

// MARK: - Supporting Views

struct FoodDetectionOverlay: View {
    let item: DetectedFoodItem
    let imageSize: CGSize
    let viewSize: CGSize
    let isSelected: Bool
    let editMode: Bool
    let onTap: () -> Void
    
    private var scaledRect: CGRect {
        let scaleX = viewSize.width / imageSize.width
        let scaleY = viewSize.height / imageSize.height
        let scale = min(scaleX, scaleY)
        
        return CGRect(
            x: item.boundingBox.origin.x * scale,
            y: item.boundingBox.origin.y * scale,
            width: item.boundingBox.size.width * scale,
            height: item.boundingBox.size.height * scale
        )
    }
    
    var body: some View {
        ZStack(alignment: .topLeading) {
            // Bounding box
            Rectangle()
                .stroke(
                    isSelected ? Color.red : SCALDesignSystem.Colors.primary,
                    lineWidth: isSelected ? 3 : 2
                )
                .background(
                    Rectangle()
                        .fill(
                            isSelected ? 
                            Color.red.opacity(0.2) : 
                            SCALDesignSystem.Colors.primary.opacity(0.1)
                        )
                )
            
            // Label
            HStack(spacing: 4) {
                if editMode && isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption2)
                        .foregroundColor(.white)
                }
                
                Text(item.name)
                    .font(.caption.bold())
                    .foregroundColor(.white)
                
                Text(item.displayConfidence)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(isSelected ? Color.red : SCALDesignSystem.Colors.primary)
            )
            .offset(x: 4, y: -20)
        }
        .frame(width: scaledRect.width, height: scaledRect.height)
        .position(
            x: scaledRect.midX,
            y: scaledRect.midY
        )
        .onTapGesture(perform: onTap)
    }
}

struct DetectedFoodRow: View {
    let item: DetectedFoodItem
    let isSelected: Bool
    let editMode: Bool
    let onTap: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // Selection indicator
            if editMode {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .red : .gray)
                    .font(.title3)
            }
            
            // Food icon
            Image(systemName: "fork.knife.circle.fill")
                .font(.title2)
                .foregroundColor(SCALDesignSystem.Colors.primary)
            
            // Food details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(item.name)
                        .font(SCALDesignSystem.Typography.subheadlineBold)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    Text("•")
                        .foregroundColor(.gray)
                    
                    Text(item.quantity)
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(.gray)
                }
                
                HStack(spacing: 12) {
                    Text("\(item.calories) cal")
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(SCALDesignSystem.Colors.calories)
                    
                    if let nutrition = item.nutritionInfo {
                        Text("P: \(Int(nutrition.protein))g")
                            .font(SCALDesignSystem.Typography.caption2)
                            .foregroundColor(SCALDesignSystem.Colors.protein)
                        
                        Text("C: \(Int(nutrition.carbs))g")
                            .font(SCALDesignSystem.Typography.caption2)
                            .foregroundColor(SCALDesignSystem.Colors.carbs)
                        
                        Text("F: \(Int(nutrition.fat))g")
                            .font(SCALDesignSystem.Typography.caption2)
                            .foregroundColor(SCALDesignSystem.Colors.fat)
                    }
                }
            }
            
            Spacer()
            
            // Confidence badge
            Text(item.displayConfidence)
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    Capsule()
                        .fill(confidenceColor(item.confidence))
                )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isSelected ? Color.red.opacity(0.1) : SCALDesignSystem.Colors.secondaryBackground)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isSelected ? Color.red : Color.clear, lineWidth: 2)
                )
        )
        .onTapGesture(perform: onTap)
    }
    
    private func confidenceColor(_ confidence: Float) -> Color {
        if confidence > 0.9 {
            return .green
        } else if confidence > 0.7 {
            return .orange
        } else {
            return .red
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.green)
                .font(.caption)
            
            Text(text)
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
            
            Spacer()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct MultiFoodScannerView_Previews: PreviewProvider {
    static var previews: some View {
        MultiFoodScannerView { _ in }
    }
}
#endif