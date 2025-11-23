import SwiftUI

struct CoachCardView: View {
    let insight: CoachInsight
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: insight.icon)
                    .foregroundColor(.white)
                    .padding(10)
                    .background(insight.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                Text(insight.title)
                    .font(.headline)
                    .foregroundColor(.calTextPrimary)
            }
            Text(insight.message)
                .foregroundColor(.calTextSecondary)
        }
        .padding(16)
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.white.opacity(0.16), lineWidth: 1)
        )
    }
}

struct QuestCardView: View {
    let quest: CoachQuest
    let action: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(quest.title)
                .font(.headline)
                .foregroundColor(.calTextPrimary)
            Text(quest.description)
                .foregroundColor(.calTextSecondary)
            ProgressView(value: quest.progress)
                .progressViewStyle(.linear)
            HStack {
                Text(quest.reward)
                    .font(.caption)
                    .foregroundColor(.calTextSecondary)
                Spacer()
                Button("Complete") { action() }
                    .font(.caption)
                    .foregroundColor(.calPrimary)
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 20))
    }
}
