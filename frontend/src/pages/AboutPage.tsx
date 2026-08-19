import {
    MissionSection,
    ChallengeSection,
    ProjectModules,
    SystemDesignDiagram,
    TechStack,
    ContactCTA,
} from "../components/about";

export function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-16">
            <div className="container mx-auto px-6">
                <MissionSection />
                <ChallengeSection />
                <ProjectModules />
                <SystemDesignDiagram />
                <TechStack />
                <ContactCTA />
            </div>
        </div>
    );
}
