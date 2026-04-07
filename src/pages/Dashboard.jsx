import { useMemo, useState } from 'react';
import {
  analyzePerformance,
  createMaterial,
  createTest,
  generateQuestions,
  getHealth,
  rewriteMaterial,
  submitTest,
} from '../api/endpoints';
import FormField from '../components/FormField.jsx';
import JsonBlock from '../components/JsonBlock.jsx';
import SectionCard from '../components/SectionCard.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const INITIAL_MATERIAL = {
  title: '',
  textContent: '',
  tags: '',
  domain: '',
  difficulty: '',
};

const INITIAL_TEST = {
  userId: '',
  type: 'mock',
  numberOfQuestions: '5',
};

const INITIAL_SUBMIT = {
  testId: '',
  userId: '',
};

const INITIAL_ANALYSIS = {
  userId: '',
};

const INITIAL_REWRITE = {
  materialId: '',
  conceptIds: '',
  insights: '',
};

const createState = () => ({ loading: false, error: '', message: '', data: null });

export default function Dashboard() {
  const [materialForm, setMaterialForm] = useState(INITIAL_MATERIAL);
  const [questionMaterialId, setQuestionMaterialId] = useState('');
  const [testForm, setTestForm] = useState(INITIAL_TEST);
  const [submitForm, setSubmitForm] = useState(INITIAL_SUBMIT);
  const [analysisForm, setAnalysisForm] = useState(INITIAL_ANALYSIS);
  const [rewriteForm, setRewriteForm] = useState(INITIAL_REWRITE);

  const [healthState, setHealthState] = useState(createState());
  const [materialState, setMaterialState] = useState(createState());
  const [questionsState, setQuestionsState] = useState(createState());
  const [createTestState, setCreateTestState] = useState(createState());
  const [submitState, setSubmitState] = useState(createState());
  const [analysisState, setAnalysisState] = useState(createState());
  const [rewriteState, setRewriteState] = useState(createState());

  const [savedMaterialId, setSavedMaterialId] = useState('');
  const [savedTestId, setSavedTestId] = useState('');
  const [testQuestions, setTestQuestions] = useState([]);
  const [questionIds, setQuestionIds] = useState([]);
  const [answersMap, setAnswersMap] = useState({});

  const handleFieldChange = (setter) => (name, value) => {
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const runAction = async (setter, action) => {
    setter({ loading: true, error: '', message: '', data: null });
    try {
      const response = await action();
      setter({
        loading: false,
        error: response?.success === false ? response?.message || 'Request failed.' : '',
        message: response?.message || 'Request completed successfully.',
        data: response,
      });
      return response;
    } catch (error) {
      setter({ loading: false, error: error.message || 'Unknown error', message: '', data: null });
      return null;
    }
  };

  const validateRequired = (values) => values.every((value) => String(value ?? '').trim() !== '');

  const normalizedGeneratedQuestions = useMemo(() => {
    const list =
      questionsState?.data?.data?.questions ||
      questionsState?.data?.questions ||
      createTestState?.data?.data?.questions ||
      createTestState?.data?.questions ||
      [];
    return Array.isArray(list) ? list : [];
  }, [questionsState, createTestState]);

  const handleHealth = async () => {
    await runAction(setHealthState, () => getHealth());
  };

  const handleCreateMaterial = async (event) => {
    event.preventDefault();
    const valid = validateRequired([
      materialForm.title,
      materialForm.textContent,
      materialForm.domain,
      materialForm.difficulty,
    ]);
    if (!valid) {
      setMaterialState({ ...createState(), error: 'Please fill all required material fields.' });
      return;
    }

    const payload = {
      ...materialForm,
      tags: materialForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const response = await runAction(setMaterialState, () => createMaterial(payload));
    const materialId = response?.data?.materialId || response?.materialId || '';
    if (materialId) {
      setSavedMaterialId(materialId);
      setQuestionMaterialId(materialId);
      setRewriteForm((prev) => ({ ...prev, materialId }));
    }
  };

  const handleGenerateQuestions = async (event) => {
    event.preventDefault();
    if (!questionMaterialId.trim()) {
      setQuestionsState({ ...createState(), error: 'materialId is required.' });
      return;
    }

    const response = await runAction(setQuestionsState, () =>
      generateQuestions({ materialId: questionMaterialId.trim() }),
    );

    const list = response?.data?.questions || response?.questions || [];
    const ids = Array.isArray(list)
      ? list.map((item) => item?.questionId || item?.id).filter(Boolean)
      : [];
    setQuestionIds(ids);
  };

  const handleCreateTest = async (event) => {
    event.preventDefault();
    if (!validateRequired([testForm.userId, testForm.type, testForm.numberOfQuestions])) {
      setCreateTestState({ ...createState(), error: 'Please complete all create-test fields.' });
      return;
    }

    const response = await runAction(setCreateTestState, () =>
      createTest({
        userId: testForm.userId.trim(),
        type: testForm.type,
        numberOfQuestions: Number(testForm.numberOfQuestions),
      }),
    );

    const testId = response?.data?.testId || response?.testId || '';
    const questions = response?.data?.questions || response?.questions || [];

    if (testId) {
      setSavedTestId(testId);
      setSubmitForm((prev) => ({ ...prev, testId, userId: prev.userId || testForm.userId }));
    }

    if (Array.isArray(questions)) {
      setTestQuestions(questions);
      const mappedIds = questions.map((q) => q?.questionId || q?.id).filter(Boolean);
      if (mappedIds.length) {
        setQuestionIds(mappedIds);
      }
      const blankAnswers = {};
      questions.forEach((q) => {
        const id = q?.questionId || q?.id;
        if (id) {
          blankAnswers[id] = { answer: '', timeTaken: '' };
        }
      });
      setAnswersMap(blankAnswers);
    }
  };

  const handleAnswerChange = (questionId, key, value) => {
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [key]: value,
      },
    }));
  };

  const handleSubmitTest = async (event) => {
    event.preventDefault();
    if (!validateRequired([submitForm.testId, submitForm.userId])) {
      setSubmitState({ ...createState(), error: 'testId and userId are required.' });
      return;
    }

    const sourceIds = testQuestions.length
      ? testQuestions.map((q) => q?.questionId || q?.id).filter(Boolean)
      : questionIds;

    if (!sourceIds.length) {
      setSubmitState({ ...createState(), error: 'No question IDs available to submit.' });
      return;
    }

    const answers = sourceIds.map((id) => {
      const values = answersMap[id] || {};
      return {
        questionId: id,
        answer: values.answer || '',
        timeTaken: Number(values.timeTaken) || 0,
      };
    });

    await runAction(setSubmitState, () =>
      submitTest({
        testId: submitForm.testId.trim(),
        userId: submitForm.userId.trim(),
        answers,
      }),
    );
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!analysisForm.userId.trim()) {
      setAnalysisState({ ...createState(), error: 'userId is required.' });
      return;
    }

    await runAction(setAnalysisState, () =>
      analyzePerformance({ userId: analysisForm.userId.trim() }),
    );
  };

  const handleRewrite = async (event) => {
    event.preventDefault();
    if (!validateRequired([rewriteForm.materialId, rewriteForm.conceptIds, rewriteForm.insights])) {
      setRewriteState({ ...createState(), error: 'Please fill all rewrite fields.' });
      return;
    }

    const payload = {
      materialId: rewriteForm.materialId.trim(),
      conceptIds: rewriteForm.conceptIds
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      insights: rewriteForm.insights,
    };

    await runAction(setRewriteState, () => rewriteMaterial(payload));
  };

  return (
    <div className="dashboard-grid">
      <SectionCard title="Health Check" description="Check API availability.">
        <button onClick={handleHealth}>Run GET /health</button>
        <StatusMessage
          loading={healthState.loading}
          error={healthState.error}
          message={healthState.message}
        />
        <JsonBlock data={healthState.data} />
      </SectionCard>

      <SectionCard title="Create Material" description="POST /materials">
        <form onSubmit={handleCreateMaterial}>
          <FormField
            label="Title *"
            name="title"
            value={materialForm.title}
            onChange={handleFieldChange(setMaterialForm)}
          />
          <label className="field">
            <span>Text Content *</span>
            <textarea
              name="textContent"
              value={materialForm.textContent}
              onChange={(event) => handleFieldChange(setMaterialForm)('textContent', event.target.value)}
            />
          </label>
          <FormField
            label="Tags (comma-separated)"
            name="tags"
            value={materialForm.tags}
            onChange={handleFieldChange(setMaterialForm)}
          />
          <FormField
            label="Domain *"
            name="domain"
            value={materialForm.domain}
            onChange={handleFieldChange(setMaterialForm)}
          />
          <FormField
            label="Difficulty *"
            name="difficulty"
            value={materialForm.difficulty}
            onChange={handleFieldChange(setMaterialForm)}
          />
          <button type="submit">Create Material</button>
        </form>
        {savedMaterialId ? <p className="chip">Saved materialId: {savedMaterialId}</p> : null}
        <StatusMessage
          loading={materialState.loading}
          error={materialState.error}
          message={materialState.message}
        />
        <JsonBlock data={materialState.data} />
      </SectionCard>

      <SectionCard title="Generate Questions" description="POST /questions/generate">
        <form onSubmit={handleGenerateQuestions}>
          <FormField
            label="Material ID *"
            name="materialId"
            value={questionMaterialId}
            onChange={(_, value) => setQuestionMaterialId(value)}
          />
          <button type="submit">Generate Questions</button>
        </form>
        {questionIds.length ? <p className="chip">Question IDs: {questionIds.join(', ')}</p> : null}
        <StatusMessage
          loading={questionsState.loading}
          error={questionsState.error}
          message={questionsState.message}
        />
        <JsonBlock data={questionsState.data} />
      </SectionCard>

      <SectionCard title="Create Test" description="POST /tests/create">
        <form onSubmit={handleCreateTest}>
          <FormField
            label="User ID *"
            name="userId"
            value={testForm.userId}
            onChange={handleFieldChange(setTestForm)}
          />
          <label className="field">
            <span>Type *</span>
            <select
              name="type"
              value={testForm.type}
              onChange={(event) => handleFieldChange(setTestForm)('type', event.target.value)}
            >
              <option value="mock">mock</option>
              <option value="mini">mini</option>
            </select>
          </label>
          <FormField
            label="Number of Questions *"
            name="numberOfQuestions"
            type="number"
            value={testForm.numberOfQuestions}
            onChange={handleFieldChange(setTestForm)}
          />
          <button type="submit">Create Test</button>
        </form>
        {savedTestId ? <p className="chip">Saved testId: {savedTestId}</p> : null}
        <StatusMessage
          loading={createTestState.loading}
          error={createTestState.error}
          message={createTestState.message}
        />
        <JsonBlock data={createTestState.data} />
      </SectionCard>

      <SectionCard title="Submit Test" description="POST /tests/submit">
        <form onSubmit={handleSubmitTest}>
          <FormField
            label="Test ID *"
            name="testId"
            value={submitForm.testId}
            onChange={handleFieldChange(setSubmitForm)}
          />
          <FormField
            label="User ID *"
            name="userId"
            value={submitForm.userId}
            onChange={handleFieldChange(setSubmitForm)}
          />

          {(testQuestions.length ? testQuestions : normalizedGeneratedQuestions).map((question, index) => {
            const qid = question?.questionId || question?.id;
            if (!qid) return null;
            return (
              <div className="question-answer" key={qid}>
                <p>
                  <strong>Q{index + 1}:</strong> {question?.text || question?.question || 'Question'}
                </p>
                <FormField
                  label="Answer"
                  name={`answer_${qid}`}
                  value={answersMap[qid]?.answer || ''}
                  onChange={(_, value) => handleAnswerChange(qid, 'answer', value)}
                />
                <FormField
                  label="Time Taken (seconds)"
                  name={`time_${qid}`}
                  type="number"
                  value={answersMap[qid]?.timeTaken || ''}
                  onChange={(_, value) => handleAnswerChange(qid, 'timeTaken', value)}
                />
              </div>
            );
          })}

          <button type="submit">Submit Test</button>
        </form>
        <StatusMessage
          loading={submitState.loading}
          error={submitState.error}
          message={submitState.message}
        />
        <JsonBlock data={submitState.data} />
      </SectionCard>

      <SectionCard title="Analyze Performance" description="POST /analysis">
        <form onSubmit={handleAnalyze}>
          <FormField
            label="User ID *"
            name="userId"
            value={analysisForm.userId}
            onChange={handleFieldChange(setAnalysisForm)}
          />
          <button type="submit">Analyze</button>
        </form>
        <StatusMessage
          loading={analysisState.loading}
          error={analysisState.error}
          message={analysisState.message}
        />
        <JsonBlock data={analysisState.data} />
      </SectionCard>

      <SectionCard title="Rewrite Material" description="POST /rewrite">
        <form onSubmit={handleRewrite}>
          <FormField
            label="Material ID *"
            name="materialId"
            value={rewriteForm.materialId}
            onChange={handleFieldChange(setRewriteForm)}
          />
          <FormField
            label="Concept IDs (comma-separated) *"
            name="conceptIds"
            value={rewriteForm.conceptIds}
            onChange={handleFieldChange(setRewriteForm)}
          />
          <label className="field">
            <span>Insights *</span>
            <textarea
              name="insights"
              value={rewriteForm.insights}
              onChange={(event) => handleFieldChange(setRewriteForm)('insights', event.target.value)}
            />
          </label>
          <button type="submit">Rewrite</button>
        </form>
        <StatusMessage
          loading={rewriteState.loading}
          error={rewriteState.error}
          message={rewriteState.message}
        />
        <JsonBlock data={rewriteState.data} />
      </SectionCard>
    </div>
  );
}
