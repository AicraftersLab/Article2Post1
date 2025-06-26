import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import useProjectStore from '../../store/useProjectStore';
import { ThemeToggle } from '../ui';

export default function Sidebar() {
  const {
    currentStep,
    newProject
  } = useProjectStore();

  const steps = [
    { id: 0, name: 'Article Input', completed: currentStep > 0 },
    { id: 1, name: 'Bullet Points', completed: currentStep > 1 },
    { id: 2, name: 'Slide Preview', completed: currentStep > 2 },
    { id: 3, name: 'Social Posts', completed: false },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-4 h-full flex flex-col">
      {/* Project Logo & Theme Toggle */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">ArticleToSocial</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Convert articles to social posts</p>
        </div>
        <ThemeToggle />
      </div>

      {/* New Project Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={newProject}
          className="w-full btn btn-primary flex items-center justify-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Progress Tracker */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Progress</h3>
        <nav aria-label="Progress">
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center">
                {step.id === currentStep ? (
                  <div className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center" aria-current="step">
                    <span className="absolute h-4 w-4 rounded-full bg-primary-200 dark:bg-primary-900" />
                    <span className="relative block h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                  </div>
                ) : step.completed ? (
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 dark:bg-primary-500">
                    <CheckIcon className="h-3 w-3 text-white" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
                <span className={`ml-3 text-sm font-medium ${step.id === currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {step.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
} 