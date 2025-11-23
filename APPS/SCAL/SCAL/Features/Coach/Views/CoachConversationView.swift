import SwiftUI

struct CoachConversationView: View {
    let messages: [CoachMessage]
    let isTyping: Bool
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(messages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }
                    if isTyping {
                        TypingIndicator().id("typing")
                    }
                }
                .padding(12)
            }
            .background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 20))
            .onChange(of: messages.count) { _, _ in
                withAnimation {
                    if isTyping {
                        proxy.scrollTo("typing", anchor: .bottom)
                    } else if let last = messages.last?.id {
                        proxy.scrollTo(last, anchor: .bottom)
                    }
                }
            }
        }
        .frame(maxHeight: 280)
    }
}

struct CoachInputBar: View {
    @Binding var text: String
    let onSend: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            TextField("Ask anything...", text: $text)
                .textFieldStyle(.roundedBorder)
                .onSubmit(onSend)
            Button(action: onSend) {
                Image(systemName: "paperplane.fill")
                    .foregroundColor(.white)
                    .padding()
                    .background(Circle().fill(Color.calPrimary))
            }
            .disabled(text.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 16))
    }
}

struct MessageBubble: View {
    let message: CoachMessage
    
    var body: some View {
        HStack {
            if message.isUser { Spacer() }
            Text(message.text)
                .padding(12)
                .foregroundColor(.white)
                .background(
                    Group {
                        if message.isUser {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(
                                    LinearGradient(
                                        colors: [Color.calPrimary, Color.calPrimary.opacity(0.7)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        } else {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )
                        }
                    }
                )
                .frame(maxWidth: 280, alignment: message.isUser ? .trailing : .leading)
            if !message.isUser { Spacer() }
        }
    }
}

struct TypingIndicator: View {
    @State private var animationAmount = 0.3
    
    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.gray)
                    .frame(width: 8, height: 8)
                    .scaleEffect(animationAmount)
                    .opacity(animationAmount)
                    .animation(
                        Animation.easeInOut(duration: 0.6)
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.2),
                        value: animationAmount
                    )
            }
        }
        .onAppear { animationAmount = 1.0 }
    }
}
