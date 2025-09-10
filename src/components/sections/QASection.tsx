import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

const QASection = () => {
  const { t } = useLanguage();
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const faqs = [
    {
      question: t('qa.question1'),
      answer: t('qa.answer1')
    },
    {
      question: t('qa.question2'),
      answer: t('qa.answer2')
    },
    {
      question: t('qa.question3'),
      answer: t('qa.answer3')
    },
    {
      question: t('qa.question4'),
      answer: t('qa.answer4')
    },
    {
      question: t('qa.question5'),
      answer: t('qa.answer5')
    },
    {
      question: t('qa.question6'),
      answer: t('qa.answer6')
    }
  ];

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 scroll-fade">
      {/* Clean Background */}
      <div className="absolute inset-0 bg-muted/20" />
      
      <div className="relative z-10 responsive-container">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 scroll-fade">
          <div className="inline-flex items-center space-x-2 bg-background/50 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 text-sm mb-6 border border-border/20">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{t('qa.badge')}</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-foreground mb-6">
            <span className="text-primary-gradient font-medium">{t('qa.title')}</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-3xl mx-auto">
            {t('qa.subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="mb-4 scroll-fade"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-card rounded-2xl border border-border/20 backdrop-blur-sm shadow-medium overflow-hidden">
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full px-6 sm:px-8 py-6 text-left flex items-center justify-between hover:bg-background/50 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-foreground pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-primary transition-transform duration-300 flex-shrink-0 ${
                      openQuestion === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {openQuestion === index && (
                  <div className="px-6 sm:px-8 pb-6 animate-fade-in">
                    <div className="border-t border-border/20 pt-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QASection;