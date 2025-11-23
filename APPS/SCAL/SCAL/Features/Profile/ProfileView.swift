//
//  ProfileView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  User profile and settings view
//

import SwiftUI

struct ProfileView: View {
    @StateObject private var viewModel: ProfileViewModel
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Environment(\.dismiss) private var dismiss
    
    init(userProfileManager: UserProfileManager, mealDataManager: MealDataManager) {
        self._viewModel = StateObject(wrappedValue: ProfileViewModel(
            userProfileManager: userProfileManager,
            mealDataManager: mealDataManager
        ))
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Profile header
                    profileHeaderSection
                    
                    // Subscription section
                    subscriptionSection
                    
                    // Health metrics
                    healthMetricsSection
                    
                    // Goals section
                    goalsSection
                    
                    // Preferences section
                    preferencesSection
                    
                    // Data & Privacy section
                    dataPrivacySection
                    
                    // Danger zone
                    dangerZoneSection
                }
                .padding()
            }
            .background(Color.black)
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.orange)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(viewModel.isEditing ? "Save" : "Edit") {
                        if viewModel.isEditing {
                            viewModel.saveChanges()
                        } else {
                            viewModel.startEditing()
                        }
                    }
                    .foregroundColor(.orange)
                }
            }
        }
        .alert("Export Complete", isPresented: $viewModel.showingExportData) {
            Button("OK") { }
        } message: {
            Text(viewModel.exportMessage)
        }
    }
    
    // MARK: - Subscription Section
    
    private var subscriptionSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Subscription")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
                
                PremiumBadge(tier: subscriptionManager.currentTier, size: .medium)
            }
            
            // Current plan details
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Current Plan:")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    Text(subscriptionManager.currentTier.displayName)
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                    
                    Spacer()
                }
                
                if subscriptionManager.isSubscribed {
                    if let daysRemaining = subscriptionManager.getRemainingDays() {
                        HStack {
                            Image(systemName: "calendar")
                                .font(.caption)
                                .foregroundColor(.gray)
                            
                            Text("\(daysRemaining) days remaining")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.1))
            )
            
            // Upgrade/Manage button
            Button(action: {
                if subscriptionManager.isSubscribed {
                    // Open subscription management
                    if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
                        UIApplication.shared.open(url)
                    }
                } else {
                    subscriptionManager.showingPaywall = true
                }
            }) {
                HStack {
                    Image(systemName: subscriptionManager.isSubscribed ? "gear" : "crown.fill")
                    Text(subscriptionManager.isSubscribed ? "Manage Subscription" : "Upgrade to Premium")
                        .font(.subheadline.bold())
                }
                .foregroundColor(.black)
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    LinearGradient(
                        colors: [.orange, .yellow],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
            }
            
            // Premium features list for free users
            if subscriptionManager.currentTier == .free {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Unlock Premium Features:")
                        .font(.caption.bold())
                        .foregroundColor(.gray)
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                        ForEach([PremiumFeature.voiceLogging, .mealPlanning, .aiNutritionCoach, .exportData], id: \.self) { feature in
                            MiniPremiumFeature(feature: feature, isUnlocked: false)
                        }
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.orange.opacity(0.1))
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.gray.opacity(0.1))
        )
    }
    
    // MARK: - Profile Header
    
    private var profileHeaderSection: some View {
        VStack(spacing: 16) {
            // Avatar
            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.orange)
            
            // Name
            if viewModel.isEditing {
                TextField("Enter your name", text: $viewModel.tempUserName)
                    .font(.title2.bold())
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            } else {
                Text(viewModel.getUserProfileManager().userName.isEmpty ? "Add your name" : viewModel.getUserProfileManager().userName)
                    .font(.title2.bold())
                    .foregroundColor(.white)
            }
            
            // Location
            if viewModel.isEditing {
                TextField("Location", text: $viewModel.tempLocation)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            } else {
                Text(viewModel.getUserProfileManager().location)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
    }
    
    // MARK: - Health Metrics
    
    private var healthMetricsSection: some View {
        VStack(spacing: 16) {
            SectionHeader(title: "Health Metrics", icon: "heart.fill")
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                // BMI Card
                HealthMetricCardView(
                    title: "BMI",
                    value: String(format: "%.1f", viewModel.bmi),
                    subtitle: viewModel.bmiCategory,
                    color: .purple
                )
                
                // Recommended Calories
                HealthMetricCardView(
                    title: "Recommended",
                    value: "\(viewModel.recommendedCalories)",
                    subtitle: "calories/day",
                    color: .green
                )
                
                // Weight
                if viewModel.isEditing {
                    VStack {
                        Text("Weight (kg)")
                            .font(.caption)
                            .foregroundColor(.gray)
                        TextField("70", value: $viewModel.tempWeight, format: .number)
                            .font(.headline.bold())
                            .foregroundColor(.blue)
                            .multilineTextAlignment(.center)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                } else {
                    HealthMetricCardView(
                        title: "Weight",
                        value: String(format: "%.1f kg", viewModel.getUserProfileManager().weight),
                        subtitle: "current",
                        color: .blue
                    )
                }
                
                // Height
                if viewModel.isEditing {
                    VStack {
                        Text("Height (cm)")
                            .font(.caption)
                            .foregroundColor(.gray)
                        TextField("170", value: $viewModel.tempHeight, format: .number)
                            .font(.headline.bold())
                            .foregroundColor(.cyan)
                            .multilineTextAlignment(.center)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                } else {
                    HealthMetricCardView(
                        title: "Height",
                        value: String(format: "%.0f cm", viewModel.getUserProfileManager().height),
                        subtitle: "current",
                        color: .cyan
                    )
                }
            }
            
            // Personal Info Row
            if viewModel.isEditing {
                personalInfoEditView
            } else {
                personalInfoDisplayView
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
    }
    
    private var personalInfoEditView: some View {
        VStack(spacing: 12) {
            HStack {
                VStack {
                    Text("Age")
                        .font(.caption)
                        .foregroundColor(.gray)
                    TextField("25", value: $viewModel.tempAge, format: .number)
                        .font(.headline)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                VStack {
                    Text("Gender")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Picker("Gender", selection: $viewModel.tempGender) {
                        Text("Male").tag("Male")
                        Text("Female").tag("Female")
                        Text("Other").tag("Other")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            
            VStack {
                Text("Activity Level")
                    .font(.caption)
                    .foregroundColor(.gray)
                Picker("Activity", selection: $viewModel.tempActivityLevel) {
                    Text("Sedentary").tag("Sedentary")
                    Text("Light").tag("Light")
                    Text("Moderate").tag("Moderate")
                    Text("Active").tag("Active")
                    Text("Very Active").tag("Very Active")
                }
                .pickerStyle(MenuPickerStyle())
            }
        }
    }
    
    private var personalInfoDisplayView: some View {
        HStack {
            InfoPill(title: "Age", value: "\(viewModel.getUserProfileManager().age)")
            InfoPill(title: "Gender", value: viewModel.getUserProfileManager().gender)
            InfoPill(title: "Activity", value: viewModel.getUserProfileManager().activityLevel)
        }
    }
    
    // MARK: - Goals Section
    
    private var goalsSection: some View {
        VStack(spacing: 16) {
            HStack {
                SectionHeader(title: "Daily Goals", icon: "target")
                
                Spacer()
                
                if viewModel.isEditing {
                    Button("Auto-Calculate") {
                        viewModel.calculateRecommendedGoals()
                    }
                    .font(.caption)
                    .foregroundColor(.orange)
                }
            }
            
            if viewModel.isEditing {
                goalsEditView
            } else {
                goalsDisplayView
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
    }
    
    private var goalsEditView: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
            GoalEditCard(title: "Calories", value: $viewModel.tempCalorieGoal, color: .orange)
            GoalEditCard(title: "Protein (g)", value: $viewModel.tempProteinGoal, color: .blue)
            GoalEditCard(title: "Carbs (g)", value: $viewModel.tempCarbsGoal, color: .green)
            GoalEditCard(title: "Fat (g)", value: $viewModel.tempFatGoal, color: .yellow)
        }
    }
    
    private var goalsDisplayView: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
            GoalCard(title: "Calories", value: "\(viewModel.getUserProfileManager().calorieGoal)", color: .orange)
            GoalCard(title: "Protein", value: String(format: "%.0fg", viewModel.getUserProfileManager().proteinGoal), color: .blue)
            GoalCard(title: "Carbs", value: String(format: "%.0fg", viewModel.getUserProfileManager().carbsGoal), color: .green)
            GoalCard(title: "Fat", value: String(format: "%.0fg", viewModel.getUserProfileManager().fatGoal), color: .yellow)
        }
    }
    
    // MARK: - Preferences Section
    
    private var preferencesSection: some View {
        VStack(spacing: 16) {
            SectionHeader(title: "Preferences", icon: "gear")
            
            VStack(spacing: 12) {
                if viewModel.isEditing {
                    Toggle("Prefer Local GCC Foods", isOn: $viewModel.tempPreferLocalFood)
                        .foregroundColor(.white)
                } else {
                    PreferenceRow(
                        title: "Local Food Preference",
                        value: viewModel.getUserProfileManager().preferLocalFood ? "Enabled" : "Disabled",
                        icon: "globe.americas.fill"
                    )
                }
                
                PreferenceRow(
                    title: "HealthKit Integration",
                    value: viewModel.getHealthKitManager().isAuthorized ? "Connected" : "Not Connected",
                    icon: "heart.fill",
                    action: viewModel.syncWithHealthKit
                )
                
                PreferenceRow(
                    title: "Export Data",
                    value: "CSV Format",
                    icon: "square.and.arrow.up",
                    action: viewModel.exportMealData
                )
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
    }
    
    // MARK: - Data & Privacy Section
    
    private var dataPrivacySection: some View {
        VStack(spacing: 16) {
            SectionHeader(title: "Data & Privacy", icon: "lock.fill")
            
            VStack(spacing: 12) {
                InfoRow(
                    title: "Data Storage",
                    description: "All data is stored locally on your device and optionally synced with iCloud."
                )
                
                InfoRow(
                    title: "Privacy",
                    description: "SCAL respects your privacy. No personal data is shared with third parties."
                )
                
                InfoRow(
                    title: "Health Data",
                    description: "Health data integration is optional and controlled through iOS Health app permissions."
                )
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
    }
    
    // MARK: - Danger Zone
    
    private var dangerZoneSection: some View {
        VStack(spacing: 16) {
            SectionHeader(title: "Danger Zone", icon: "exclamationmark.triangle.fill")
            
            Button("Reset All Data") {
                viewModel.resetAllData()
            }
            .font(.headline)
            .foregroundColor(.red)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.red, lineWidth: 1)
            )
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
    }
}

// MARK: - Supporting Views

struct SectionHeader: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.orange)
            Text(title)
                .font(.headline.bold())
                .foregroundColor(.white)
            Spacer()
        }
    }
}

struct HealthMetricCardView: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
            
            Text(value)
                .font(.title3.bold())
                .foregroundColor(color)
            
            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct InfoPill: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.gray)
            Text(value)
                .font(.caption.bold())
                .foregroundColor(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.gray.opacity(0.2))
        .cornerRadius(20)
    }
}

struct GoalCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
            
            Text(value)
                .font(.headline.bold())
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct GoalEditCard: View {
    let title: String
    @Binding var value: any Numeric
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
            
            if value is Int {
                TextField("0", value: Binding(
                    get: { value as! Int },
                    set: { value = $0 }
                ), format: .number)
                .font(.headline.bold())
                .foregroundColor(color)
                .multilineTextAlignment(.center)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            } else if value is Double {
                TextField("0.0", value: Binding(
                    get: { value as! Double },
                    set: { value = $0 }
                ), format: .number)
                .font(.headline.bold())
                .foregroundColor(color)
                .multilineTextAlignment(.center)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct PreferenceRow: View {
    let title: String
    let value: String
    let icon: String
    var action: (() -> Void)? = nil
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.orange)
                .frame(width: 20)
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(.white)
            
            Spacer()
            
            Text(value)
                .font(.caption)
                .foregroundColor(.gray)
            
            if action != nil {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
        .onTapGesture {
            action?()
        }
    }
}

struct InfoRow: View {
    let title: String
    let description: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.bold())
                .foregroundColor(.white)
            
            Text(description)
                .font(.caption)
                .foregroundColor(.gray)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}