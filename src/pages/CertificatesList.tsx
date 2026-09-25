import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Award } from 'lucide-react';

export function CertificatesList() {
  const { t } = useTranslation();
  const { progress, user, courses } = useStore();

  if (!user) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to view your certificates.</p>
      </div>
    );
  }

  const completedCourses = courses.filter(c => progress[c.id]?.isCompleted);

  return (
    <div className="w-full px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{t('your_certificates')}</h1>
        <p className="text-muted-foreground text-lg">{t('view_download_certificates')}</p>
      </div>

      {completedCourses.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t('no_certificates_yet')}</h3>
          <p className="text-muted-foreground mb-6">{t('complete_course_to_earn')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link 
              to="/"
              className="px-6 py-3 bg-foreground text-background rounded-full font-bold shadow hover:shadow-lg hover:bg-foreground/90 transition-all active:scale-95 inline-block"
            >
              {t('explore_courses')}
            </Link>
            <Link 
              to="/certificate/html-crash-course?preview=true"
              className="px-6 py-3 bg-card border border-border text-foreground rounded-full font-bold shadow-sm hover:shadow hover:bg-muted transition-all active:scale-95 inline-block"
            >
              {t('preview_demo_certificate')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {completedCourses.map(course => {
            const courseProgress = progress[course.id];
            const date = new Date(courseProgress.completionDate || Date.now()).toLocaleDateString();

            return (
              <div key={course.id} className="flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="p-6 flex flex-col items-center text-center border-b border-border bg-muted/30">
                  <Award className="w-16 h-16 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{t('completed_on')} {date}</p>
                </div>
                <div className="p-4 bg-card">
                  <Link 
                    to={`/certificate/${course.id}`}
                    className="w-full py-2.5 bg-foreground text-background rounded-lg font-bold text-center hover:bg-foreground/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
                  >
                    <Award className="w-4 h-4" />
                    {t('view_certificate')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
