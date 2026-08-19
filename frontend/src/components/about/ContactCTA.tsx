import { Github, Linkedin, Mail } from "lucide-react";
import { Button } from "../ui/button";

export function ContactCTA() {
    return (
        <div className="max-w-2xl mx-auto text-center glass-card p-10 rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
            <h2 className="text-2xl font-bold text-white mb-4">
                Empower Your Health Center
            </h2>
            <p className="text-slate-400 mb-8">
                Ready to deploy RuralHealthAI in your district? Join our mission to bring
                intelligent healthcare to remote communities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <Button
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2 h-12 px-6"
                    onClick={() => (window.location.href = "mailto:alishasshad@gmail.com")}
                >
                    <Mail className="h-4 w-4" /> Get in Touch
                </Button>
                <Button
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 gap-2 h-12 px-6"
                    onClick={() =>
                        window.open(
                            "https://www.linkedin.com/in/alisha-shad-983456380/",
                            "_blank",
                        )
                    }
                >
                    <Linkedin className="h-4 w-4" /> Professional Profile
                </Button>
                <Button
                    className="bg-teal-500 hover:bg-teal-600 text-white gap-2 h-12 px-6"
                    onClick={() =>
                        window.open("https://www.github.com/alishashad", "_blank")
                    }
                >
                    <Github className="h-4 w-4" /> View Open Source
                </Button>
            </div>
        </div>
    );
}
