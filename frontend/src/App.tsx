import Badge from "./components/ui/Badge";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import Input from "./components/ui/Input";
import ThemeSwitcher from "./components/ThemeSwitcher";

export default function App() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <ThemeSwitcher />

      <Card title="Welcome back" description="Log in to continue">
        <div className="space-y-4">
          <Input id="email" label="Email" placeholder="john@email.com" />
          <Input id="pw" label="Password" type="password" error="Required" />
          <Button fullWidth>Log in</Button>
          <div className="flex gap-2">
            <Badge variant="pending">Pending</Badge>
            <Badge variant="preparing">Preparing</Badge>
            <Badge variant="ready">Ready</Badge>
            <Badge variant="cancelled">Cancelled</Badge>
          </div>
        </div>
      </Card>
    </main>
  );
}