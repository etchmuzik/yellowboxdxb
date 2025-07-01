export default function TestApp() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#ffd700', minHeight: '100vh' }}>
      <h1 style={{ color: 'black' }}>YellowBox Test App</h1>
      <p>If you can see this, React is working!</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
}