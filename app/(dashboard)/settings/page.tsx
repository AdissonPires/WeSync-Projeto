import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-text text-base font-semibold">
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company">Nome da empresa</Label>
            <Input id="company" defaultValue="Acme Corp" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domain">Domínio corporativo</Label>
            <Input id="domain" defaultValue="acme.com" />
          </div>
          <Button className="w-fit">Salvar alterações</Button>
        </CardContent>
      </Card>
    </div>
  );
}
