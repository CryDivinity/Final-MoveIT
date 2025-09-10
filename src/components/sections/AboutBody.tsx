import { Button } from '@/components/ui/button';
import { Download, Info, Smartphone, Navigation2, Shield, Zap } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useNavigate } from 'react-router-dom';
const AboutBody = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Clean Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted/80" />

            {/* Subtle Background Pattern */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0%, transparent 50%)`,
                }}
            />

            {/* Content Layout */}
            <div className="relative z-10 responsive-container">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
                    {/* Left Content */}
                    <div className="space-y-8 text-left lg:text-left">
                        {/* Add your left content here */}
                    // ...existing code...
<div className="space-y-8 text-left lg:text-left">
    {/* Add your left content here */}
    <Button onClick={() => navigate("/")}>
        {t("Back to Home")}
    </Button>
</div>
// ...existing code...
                        {/* Add your right content here */}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutBody;
