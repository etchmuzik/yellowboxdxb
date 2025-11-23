import SwiftUI

struct CoachChatView: View {
    @StateObject private var viewModel = CoachChatLegacyViewModel()
    @EnvironmentObject var dataManager: MealDataManager
    @State private var messageText = ""
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Chat messages
            ScrollViewReader { scrollProxy in
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.messages) { message in
                            MessageRow(message: message)
                                .id(message.id)
                        }
                    }
                    .padding()
                }
                .background(Color(UIColor.systemGroupedBackground))
                .onChange(of: viewModel.messages.count) { _, _ in
                    withAnimation {
                        scrollProxy.scrollTo(viewModel.messages.last?.id, anchor: .bottom)
                    }
                }
            }
            
            // Input area
            messageInputArea
        }
        .navigationTitle("AI Coach")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { viewModel.clearChat() }) {
                    Image(systemName: "trash")
                }
            }
        }
        .onAppear {
            viewModel.startConversation(totalCalories: dataManager.totalCalories)
        }
    }
    
    private var messageInputArea: some View {
        HStack(spacing: 12) {
            TextField("Ask your coach...", text: $messageText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .focused($isInputFocused)
                .onSubmit {
                    sendMessage()
                }
            
            Button(action: sendMessage) {
                Image(systemName: "paperplane.fill")
                    .foregroundColor(messageText.isEmpty ? .gray : .accentColor)
            }
            .disabled(messageText.isEmpty)
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
    }
    
    private func sendMessage() {
        guard !messageText.isEmpty else { return }
        
        viewModel.sendMessage(messageText, totalCalories: dataManager.totalCalories)
        messageText = ""
    }
}

// MARK: - Message Row
struct MessageRow: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer()
            }
            
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
                if !message.isUser {
                    HStack(spacing: 8) {
                        Image(systemName: "brain.head.profile")
                            .font(.caption)
                            .foregroundColor(.accentColor)
                        Text("AI Coach")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.accentColor)
                    }
                }
                
                Text(message.text)
                    .padding(12)
                    .background(message.isUser ? Color.accentColor : Color(UIColor.tertiarySystemGroupedBackground))
                    .foregroundColor(message.isUser ? .white : .primary)
                    .cornerRadius(16)
                    .frame(maxWidth: 280, alignment: message.isUser ? .trailing : .leading)
                
                // Quick actions for coach messages
                if !message.isUser && !message.quickActions.isEmpty {
                    HStack(spacing: 8) {
                        ForEach(message.quickActions, id: \.self) { action in
                            Button(action: {}) {
                                Text(action)
                                    .font(.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.accentColor.opacity(0.1))
                                    .foregroundColor(.accentColor)
                                    .cornerRadius(12)
                            }
                        }
                    }
                }
            }
            
            if !message.isUser {
                Spacer()
            }
        }
    }
}

// MARK: - View Model
@MainActor
class CoachChatLegacyViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    
    private let coachPersonalities = [
        "motivational": [
            "Great job logging your meals! 💪",
            "You're making awesome progress!",
            "Keep up the fantastic work!",
            "Every meal logged is a step toward your goals!"
        ],
        "analytical": [
            "Based on your intake, you're at %d%% of your daily goal.",
            "Your protein intake is looking good today.",
            "Consider adding more vegetables for fiber.",
            "You have %d calories remaining for today."
        ],
        "friendly": [
            "Hey there! How's your day going?",
            "I noticed you've been consistent with tracking!",
            "What's your favorite healthy meal?",
            "Remember to stay hydrated! 💧"
        ]
    ]
    
    func startConversation(totalCalories: Int) {
        guard messages.isEmpty else { return }
        
        let greeting = """
        Hello! I'm your AI nutrition coach. I'm here to help you reach your health goals! 🎯
        
        I see you've consumed \(totalCalories) calories today. How are you feeling about your progress?
        """
        
        messages.append(ChatMessage(
            text: greeting,
            isUser: false,
            quickActions: ["Check my stats", "Give me tips", "Meal suggestions"]
        ))
    }
    
    func sendMessage(_ text: String, totalCalories: Int) {
        // Add user message
        messages.append(ChatMessage(text: text, isUser: true))
        
        // Generate coach response
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.generateResponse(to: text, totalCalories: totalCalories)
        }
    }
    
    private func generateResponse(to userMessage: String, totalCalories: Int) {
        let lowercased = userMessage.lowercased()
        
        var response = ""
        var quickActions: [String] = []
        
        if lowercased.contains("stats") || lowercased.contains("progress") {
            response = """
            Here's your summary for today:
            • Calories: \(totalCalories) consumed
            • You're doing great with consistent tracking!
            • Remember to log your water intake too
            
            Your 7-day streak shows real commitment! 🔥
            """
            quickActions = ["See weekly trend", "Set new goal"]
            
        } else if lowercased.contains("tip") || lowercased.contains("advice") {
            let tips = [
                "Try to eat protein with every meal to stay fuller longer and maintain muscle mass.",
                "Aim for at least 5 servings of fruits and vegetables daily for optimal nutrition.",
                "Stay hydrated! Aim for 8 glasses of water throughout the day.",
                "Planning meals ahead can help you make healthier choices.",
                "Don't skip meals - it can lead to overeating later."
            ]
            response = tips.randomElement()!
            quickActions = ["More tips", "Meal ideas"]
            
        } else if lowercased.contains("meal") || lowercased.contains("suggest") {
            response = """
            Based on your remaining calories, here are some great options:
            
            🥗 Grilled chicken salad (320 cal)
            🍲 Vegetable soup with whole grain bread (280 cal)
            🥙 Turkey wrap with veggies (350 cal)
            🍳 Veggie omelette with toast (300 cal)
            """
            quickActions = ["More options", "Recipe ideas"]
            
        } else if lowercased.contains("motivat") || lowercased.contains("help") {
            response = """
            You're doing amazing! 🌟
            
            Remember, every small choice adds up to big results. You've already logged meals today - that's more than most people do!
            
            What matters is progress, not perfection. Keep going!
            """
            quickActions = ["Set reminder", "Track water"]
            
        } else {
            // Default conversational response
            let responses = [
                "That's a great question! Based on your goals, I'd recommend focusing on balanced meals with plenty of protein and vegetables.",
                "I understand! Consistency is key. You're already on the right track by tracking your meals.",
                "Good point! Would you like me to help you plan your next meal?",
                "Absolutely! Small changes can make a big difference over time."
            ]
            response = responses.randomElement()!
            quickActions = ["Meal suggestions", "Check progress"]
        }
        
        messages.append(ChatMessage(
            text: response,
            isUser: false,
            quickActions: quickActions
        ))
    }
    
    func clearChat() {
        messages.removeAll()
    }
}

// MARK: - Chat Message Model
struct ChatMessage: Identifiable {
    let id = UUID()
    let text: String
    let isUser: Bool
    let timestamp = Date()
    let quickActions: [String]
    
    init(text: String, isUser: Bool, quickActions: [String] = []) {
        self.text = text
        self.isUser = isUser
        self.quickActions = quickActions
    }
}

#Preview {
    NavigationView {
        CoachChatView()
            .environmentObject(MealDataManager())
    }
}
