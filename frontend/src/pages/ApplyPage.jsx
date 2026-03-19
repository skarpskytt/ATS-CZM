import { useEffect, useState } from 'react'
import DatePicker from '../components/DatePicker'
import Footer from '../components/Footer'

const initialForm = {
  position_applied_for: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  permanent_address: '',
  gender: '',
  civil_status: '',
  birthdate: '',
  highest_education_level: '',
  bachelors_degree_course: '',
  year_graduated: '',
  last_school_attended: '',
  prc_license: '',
  total_work_experience_years: '',
  contact_number: '',
  email_address: '',
  expected_salary: '',
  preferred_work_location: '',
  vacancy_source: '',
}

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const educationOptions = [
  { value: '', label: 'Select' },
  { value: 'Elementary', label: 'Elementary' },
  { value: 'High School', label: 'High School' },
  { value: 'Senior High', label: 'Senior High' },
  { value: 'Vocational', label: 'Vocational' },
  { value: 'College', label: 'College' },
  { value: 'Post Grad', label: 'Post Grad' }
]

const genderOptions = [
  { value: '', label: 'Select' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other / Prefer to self-describe' }
]

const vacancySourceOptions = [
  { value: '', label: 'Select' },
  { value: 'JobStreet', label: '💼 JobStreet' },
  { value: 'LinkedIn', label: '🔗 LinkedIn' },
  { value: 'Indeed', label: '🔍 Indeed' },
  { value: 'Kalibrr', label: '🎯 Kalibrr' },
  { value: 'Facebook / Social Media', label: '📱 Facebook / Social Media' },
  { value: 'Company Website', label: '🌐 Company Website' },
  { value: 'Referral from Employee', label: '🤝 Referral from an Employee' },
  { value: 'Job Fair', label: '🏢 Job Fair / Recruitment Event' },
  { value: 'Walk-in', label: '🚶 Walk-in' },
  { value: 'Other', label: '✏️ Other' },
]

const civilStatusOptions = [
  { value: '', label: 'Select' },
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Widowed', label: 'Widowed / Widower' },
  { value: 'Legally Separated', label: 'Legally Separated' },
  { value: 'Annulled', label: 'Annulled' },
  { value: 'Divorced', label: 'Divorced (foreign national)' },
]

const formSteps = [
  { id: 1, title: 'Resume' },
  { id: 2, title: 'Identity' },
  { id: 3, title: 'Education' },
  { id: 4, title: 'Contact' },
  { id: 5, title: 'Review' },
]

const extractError = async (response) => {
  try {
    const payload = await response.json()
    if (payload?.message) {
      return payload.message
    }
    if (payload?.errors) {
      const firstKey = Object.keys(payload.errors)[0]
      if (firstKey) {
        return payload.errors[firstKey][0]
      }
    }
  } catch (err) {
    return null
  }

  return 'Unable to submit your application. Please try again.'
}

function ApplyPage() {
  const [form, setForm] = useState(initialForm)
  const [customGender, setCustomGender] = useState('')
  const [customVacancySource, setCustomVacancySource] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [positions, setPositions] = useState([])
  const [positionsLoading, setPositionsLoading] = useState(true)
  const [positionsError, setPositionsError] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [honeypotWebsite, setHoneypotWebsite] = useState('')
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now())
  const [currentStep, setCurrentStep] = useState(1)
  const [furthestStepReached, setFurthestStepReached] = useState(1)

  const totalSteps = formSteps.length
  const progressPercent = Math.round((currentStep / totalSteps) * 100)

  const validateStep = (step) => {
    if (step === 1 && !cvFile) {
      setError('Please upload your resume first to continue.')
      return false
    }

    const requiredByStep = {
      2: [
        'position_applied_for',
        'last_name',
        'first_name',
        'permanent_address',
        'gender',
        'civil_status',
        'birthdate',
      ],
      3: ['highest_education_level', 'last_school_attended'],
      4: ['contact_number', 'email_address', 'preferred_work_location'],
    }

    if (!requiredByStep[step]) {
      return true
    }

    const missingField = requiredByStep[step].find((field) => !String(form[field] ?? '').trim())
    if (missingField) {
      setError('Please complete all required fields before proceeding to the next step.')
      return false
    }

    if (step === 2 && form.gender === 'Other' && !customGender.trim()) {
      setError('Please specify your gender to continue.')
      return false
    }

    return true
  }

  const goNextStep = () => {
    setMessage(null)
    if (!validateStep(currentStep)) {
      return
    }

    setError(null)
    setCurrentStep((previous) => {
      const nextStep = Math.min(previous + 1, totalSteps)
      setFurthestStepReached((furthest) => Math.max(furthest, nextStep))
      return nextStep
    })
  }

  const goPreviousStep = () => {
    setMessage(null)
    setError(null)
    setCurrentStep((previous) => Math.max(previous - 1, 1))
  }

  const goToStep = (step) => {
    if (submitting) {
      return
    }

    if (step > furthestStepReached) {
      return
    }

    setMessage(null)
    setError(null)
    setCurrentStep(step)
  }


  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleFileChange = (event) => {
    const [file] = event.target.files
    setCvFile(file || null)
    setError(null)
  }

  const buildFormData = () => {
    const formData = new FormData()

    Object.entries(form).forEach(([key, value]) => {
      if (key === 'gender') {
        const genderValue = value === 'Other' ? (customGender.trim() || 'Other') : value
        if (genderValue) formData.append('gender', genderValue)
      } else if (key === 'vacancy_source') {
        const sourceValue = value === 'Other' ? (customVacancySource.trim() || 'Other') : value
        if (sourceValue) formData.append('vacancy_source', sourceValue)
      } else if (value !== '' && value !== null) {
        formData.append(key, value)
      }
    })

    if (cvFile) {
      formData.append('upload_cv', cvFile)
    }

    formData.append('website', honeypotWebsite)
    formData.append('form_started_at', String(formStartedAt))

    return formData
  }

  useEffect(() => {
    document.title = 'Careers — Czark Mak Corporation'
    return () => { document.title = 'CZM — Applicant Tracking System' }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadPositions = async () => {
      try {
        const response = await fetch(`${apiBase}/api/positions`)

        if (!response.ok) {
          throw new Error('Failed to load positions')
        }

        const payload = await response.json()
        if (isMounted) {
          setPositions(payload)
          setPositionsError(null)
        }
      } catch (err) {
        if (isMounted) {
          setPositionsError('Unable to load positions right now.')
        }
      } finally {
        if (isMounted) {
          setPositionsLoading(false)
        }
      }
    }

    loadPositions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [message])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    if (!termsAccepted) {
      setError('Please accept the terms and conditions.')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${apiBase}/api/public/applicants`, {
        method: 'POST',
        body: buildFormData(),
      })

      if (!response.ok) {
        const errorMessage = await extractError(response)
        setError(errorMessage)
        setSubmitting(false)
        return
      }

      setMessage('Your application has been submitted. We will update you after review through email.')
      setForm(initialForm)
      setCustomGender('')
      setCustomVacancySource('')
      setCvFile(null)
      setHoneypotWebsite('')
      setFormStartedAt(Date.now())
      setTermsAccepted(false)
      setCurrentStep(1)
      setFurthestStepReached(1)
    } catch (err) {
      setError('Network error. Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayValue = (value) => {
    const text = String(value ?? '').trim()
    return text !== '' ? text : 'Not provided'
  }

  const resolvedGender = form.gender === 'Other' ? (customGender.trim() || 'Other') : form.gender
  const resolvedVacancySource = form.vacancy_source === 'Other'
    ? (customVacancySource.trim() || 'Other')
    : form.vacancy_source

  return (
    <>
      <div className="apply-body">
      <section className="apply-hero">
        <div className="apply-hero-glow glow-left" />
        <div className="apply-hero-glow glow-right" />
        <div className="apply-hero-inner">
          <div className="apply-hero-copy">
            <p className="apply-kicker">CZARK MAK CORPORATION</p>
            <h1 className="apply-title apply-title-rotate">
              <span className="apply-title-prefix">Apply for</span>
              <span className="apply-rotator" aria-label="Rotating career keywords">
                <span className="apply-rotator-track">
                  <span>Careers</span>
                  <span>Growth</span>
                  <span>Success</span>
                  <span>Vision</span>
                  <span>Future</span>
                  <span>CZM</span>
                  <span>Careers</span>
                </span>
              </span>
            </h1>
            <p className="apply-lead">
              Submit your details and CV. Our recruiters will review your application and update you through email.
            </p>
            <div className="apply-hero-badges">
              <span className="apply-pill">Fast review</span>
              <span className="apply-pill">Secure uploads</span>
              <span className="apply-pill">Email updates</span>
            </div>
          </div>
          <div className="apply-hero-logo-only" aria-label="Czark Mak logo">
            <img
              src="/LOGO_CZM_MAIN%20LOGO_02.jpg"
              alt="Czark Mak Corporation"
              className="apply-hero-logo-img"
            />
          </div>
        </div>
      </section>

      <form className="apply-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="website"
          value={honeypotWebsite}
          onChange={(event) => setHoneypotWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-10000px', opacity: 0, height: 0, width: 0 }}
        />
        <div className="card apply-card">
          <div className="card-body apply-card-body">
            <div className="apply-form-header">
              <div>
                <h2 className="apply-form-title">Application Form</h2>
                <p className="apply-form-subtitle">Complete all required fields to submit.</p>
              </div>
            </div>

            <div className="apply-progress" aria-label="Application form progress">
              <div className="apply-progress-meta">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="apply-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                <span className="apply-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="apply-progress-steps">
                {formSteps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className={`apply-progress-step${step.id === currentStep ? ' is-active' : ''}${step.id < currentStep ? ' is-complete' : ''}`}
                    onClick={() => goToStep(step.id)}
                    disabled={step.id > furthestStepReached || submitting}
                  >
                    <span>{step.id}</span>
                    <small>{step.title}</small>
                  </button>
                ))}
              </div>
            </div>

            {currentStep === 1 ? (
            <div className="form-section" style={{ '--delay': '0ms' }}>
              <div className="divider apply-divider">Resume</div>
              <div className="resume-first-card">
                <p className="resume-first-title">Upload your resume to get started</p>
                <p className="resume-first-subtitle">We will attach your resume to your application. Complete the details manually in the next steps.</p>
                <input
                  className="file-input file-input-bordered file-input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  type="file"
                  name="upload_cv"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                {cvFile ? <p className="resume-file-pill">Attached: {cvFile.name}</p> : <p className="resume-file-help">Accepted format: PDF, DOC, DOCX</p>}
              </div>
            </div>
            ) : null}

            {currentStep === 2 ? (
            <div className="form-section" style={{ '--delay': '0ms' }}>
              <div className="divider apply-divider">Position &amp; Identity</div>
              <div className="grid gap-4 md:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Position applied for *</span>
                </label>
                {positionsLoading ? (
                  <div className="skeleton h-11 w-full" />
                ) : positions.length > 0 ? (
                  <select
                    name="position_applied_for"
                    value={form.position_applied_for}
                    onChange={handleChange}
                    required
                    className="select select-bordered select-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  >
                    {[{ value: '', label: 'Select' }, ...positions.map((position) => ({
                      value: position.title,
                      label: position.title
                    }))].map((option) => (
                      <option key={`position-${option.value || 'empty'}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="position_applied_for"
                    value={form.position_applied_for}
                    onChange={handleChange}
                    placeholder="e.g., Frontend Developer"
                    required
                    className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  />
                )}
                <label className="label">
                  {positionsError ? <span className="label-text-alt text-error">{positionsError}</span> : null}
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Last name *</span>
                </label>
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">First name *</span>
                </label>
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Middle name</span>
                </label>
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" name="middle_name" value={form.middle_name} onChange={handleChange} />
              </div>
            </div>
              <div className="form-control">
              <label className="label">
                <span className="label-text">Permanent address *</span>
              </label>
              <textarea
                name="permanent_address"
                value={form.permanent_address}
                onChange={handleChange}
                placeholder="Street, City, Province, ZIP"
                required
                className="textarea textarea-bordered textarea-lg min-h-[140px] w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
              />
            </div>
              <div className="grid gap-4 lg:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Gender *</span>
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  className="select select-bordered select-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                >
                  {genderOptions.map((option) => (
                    <option key={`gender-${option.value || 'empty'}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {form.gender === 'Other' && (
                  <input
                    type="text"
                    value={customGender}
                    onChange={e => setCustomGender(e.target.value)}
                    placeholder="Please specify your gender"
                    required
                    maxLength={100}
                    className="input input-bordered input-lg w-full bg-white mt-2 transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  />
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Civil status *</span>
                </label>
                <select
                  name="civil_status"
                  value={form.civil_status}
                  onChange={handleChange}
                  required
                  className="select select-bordered select-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                >
                  {civilStatusOptions.map((option) => (
                    <option key={`civil-${option.value || 'empty'}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Birthdate *</span>
                </label>
                <DatePicker
                  name="birthdate"
                  value={form.birthdate}
                  onChange={handleChange}
                  required
                  placeholder="Select birthdate"
                />
              </div>

              </div>
            </div>
            ) : null}

            {currentStep === 3 ? (
            <div className="form-section" style={{ '--delay': '80ms' }}>
              <div className="divider apply-divider">Education</div>
              <div className="grid gap-4 lg:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Highest education *</span>
                </label>
                <select
                  name="highest_education_level"
                  value={form.highest_education_level}
                  onChange={handleChange}
                  required
                  className="select select-bordered select-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                >
                  {educationOptions.map((option) => (
                    <option key={`education-${option.value || 'empty'}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Bachelor's degree (course)</span>
                </label>
                <input
                  className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  name="bachelors_degree_course"
                  value={form.bachelors_degree_course}
                  onChange={handleChange}
                  placeholder="e.g., BS Computer Science"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Year graduated</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  name="year_graduated"
                  value={form.year_graduated}
                  onChange={handleChange}
                  min="1900"
                  max="2100"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Last school attended *</span>
                </label>
                <input
                  className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  name="last_school_attended"
                  value={form.last_school_attended}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
              <div className="grid gap-4 lg:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">PRC license (if any)</span>
                </label>
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" name="prc_license" value={form.prc_license} onChange={handleChange} />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Total work experience (years)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  name="total_work_experience_years"
                  value={form.total_work_experience_years}
                  onChange={handleChange}
                />
              </div>
              </div>
            </div>
            ) : null}

            {currentStep === 4 ? (
            <div className="form-section" style={{ '--delay': '160ms' }}>
              <div className="divider apply-divider">Contact</div>
              <div className="grid gap-4 lg:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contact number *</span>
                </label>
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" name="contact_number" value={form.contact_number} onChange={handleChange} required />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email address *</span>
                </label>
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" type="email" name="email_address" value={form.email_address} onChange={handleChange} required />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Expected salary</span>
                </label>
                <div className="peso-input-wrap">
                  <span className="peso-prefix">₱</span>
                  <input
                    className="peso-input input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                    type="number"
                    min="0"
                    step="0.01"
                    name="expected_salary"
                    value={form.expected_salary}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Preferred work location *</span>
                </label>
                <input
                  className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  name="preferred_work_location"
                  value={form.preferred_work_location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-control lg:col-span-2">
                <label className="label">
                  <span className="label-text">Where did you learn about this vacancy?</span>
                </label>
                <select
                  name="vacancy_source"
                  value={form.vacancy_source}
                  onChange={handleChange}
                  className="select select-bordered select-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                >
                  {vacancySourceOptions.map((option) => (
                    <option key={`source-${option.value || 'empty'}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {form.vacancy_source === 'Other' && (
                  <input
                    type="text"
                    value={customVacancySource}
                    onChange={e => setCustomVacancySource(e.target.value)}
                    placeholder="Please tell us where you heard about this vacancy"
                    maxLength={255}
                    className="input input-bordered input-lg w-full bg-white mt-2 transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                  />
                )}
              </div>
              </div>
            </div>
            ) : null}

            {currentStep === 5 ? (
            <div className="form-section" style={{ '--delay': '240ms' }}>
              <div className="divider apply-divider">Review</div>
              <div className="review-grid">
                <div className="review-item"><strong>Resume</strong><span>{cvFile ? cvFile.name : 'Not uploaded'}</span></div>
                <div className="review-item"><strong>Position</strong><span>{displayValue(form.position_applied_for)}</span></div>
                <div className="review-item"><strong>Last name</strong><span>{displayValue(form.last_name)}</span></div>
                <div className="review-item"><strong>First name</strong><span>{displayValue(form.first_name)}</span></div>
                <div className="review-item"><strong>Middle name</strong><span>{displayValue(form.middle_name)}</span></div>
                <div className="review-item"><strong>Gender</strong><span>{displayValue(resolvedGender)}</span></div>
                <div className="review-item"><strong>Civil status</strong><span>{displayValue(form.civil_status)}</span></div>
                <div className="review-item"><strong>Birthdate</strong><span>{displayValue(form.birthdate)}</span></div>
                <div className="review-item review-item-full"><strong>Permanent address</strong><span>{displayValue(form.permanent_address)}</span></div>

                <div className="review-item"><strong>Highest education</strong><span>{displayValue(form.highest_education_level)}</span></div>
                <div className="review-item"><strong>Degree course</strong><span>{displayValue(form.bachelors_degree_course)}</span></div>
                <div className="review-item"><strong>Year graduated</strong><span>{displayValue(form.year_graduated)}</span></div>
                <div className="review-item"><strong>Last school</strong><span>{displayValue(form.last_school_attended)}</span></div>
                <div className="review-item"><strong>PRC license</strong><span>{displayValue(form.prc_license)}</span></div>
                <div className="review-item"><strong>Work experience</strong><span>{displayValue(form.total_work_experience_years)}</span></div>

                <div className="review-item"><strong>Contact number</strong><span>{displayValue(form.contact_number)}</span></div>
                <div className="review-item"><strong>Email address</strong><span>{displayValue(form.email_address)}</span></div>
                <div className="review-item"><strong>Expected salary</strong><span>{displayValue(form.expected_salary)}</span></div>
                <div className="review-item"><strong>Preferred location</strong><span>{displayValue(form.preferred_work_location)}</span></div>
                <div className="review-item review-item-full"><strong>Vacancy source</strong><span>{displayValue(resolvedVacancySource)}</span></div>
              </div>

              <div className="divider apply-divider">Terms &amp; Conditions</div>
              <div className="terms-shell">
                <div className="terms-agreement-card">
                  <div className="terms-agreement-points">
                    <div className="terms-agreement-point">
                      <span className="terms-point-icon">📋</span>
                      <div>
                        <strong>Accuracy</strong>
                        <p>All information you provide is accurate and complete.</p>
                      </div>
                    </div>
                    <div className="terms-agreement-point">
                      <span className="terms-point-icon">📞</span>
                      <div>
                        <strong>Contact consent</strong>
                        <p>We may reach you by email or phone about your application.</p>
                      </div>
                    </div>
                    <div className="terms-agreement-point">
                      <span className="terms-point-icon">🔒</span>
                      <div>
                        <strong>Privacy</strong>
                        <p>Your data is kept confidential and used only for recruitment.</p>
                      </div>
                    </div>
                    <div className="terms-agreement-point">
                      <span className="terms-point-icon">📁</span>
                      <div>
                        <strong>Retention</strong>
                        <p>Your application may be kept for up to 2 years for future openings.</p>
                      </div>
                    </div>
                  </div>
                  <div className="terms-divider" />
                  <label className="terms-check-row">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                      className="terms-check-box"
                    />
                    <span>
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        className="terms-link"
                        onClick={() => setTermsModalOpen(true)}
                      >
                        Terms and Conditions
                      </button>
                    </span>
                  </label>
                </div>
              </div>
            </div>
            ) : null}

            <div className="form-section" style={{ '--delay': '400ms' }}>
              <div className="apply-step-actions">
                <button
                  type="button"
                  className="btn btn-lg apply-step-btn apply-step-btn-secondary"
                  onClick={goPreviousStep}
                  disabled={currentStep === 1 || submitting}
                >
                  Back
                </button>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    className="btn btn-lg apply-step-btn apply-step-btn-primary"
                    onClick={goNextStep}
                    disabled={submitting}
                  >
                    Continue
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className={`btn btn-lg apply-step-btn apply-submit${submitting ? ' apply-submit--loading' : ''}`}>
                    {submitting ? (
                      <span className="apply-submit-loading-content">
                        <svg className="apply-submit-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="42 14" />
                        </svg>
                        Submitting your application...
                      </span>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>

              <div className="apply-form-feedback">
              {message ? (
                <div className="alert alert-success apply-form-alert" role="alert">
                  <span>{message}</span>
                </div>
              ) : null}
              {error ? (
                <div className="alert alert-error apply-form-alert" role="alert">
                  <span>{error}</span>
                </div>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ── Terms Modal ── */}
      {termsModalOpen && (
        <div className="terms-modal-backdrop" onClick={() => setTermsModalOpen(false)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-head">
              <div className="terms-modal-title-wrap">
                <div className="terms-modal-logo">
                  <img src="/logoczark.png" alt="" />
                </div>
                <div>
                  <p className="terms-modal-kicker">Czark Mak Corporation</p>
                  <h2 className="terms-modal-title">Terms &amp; Conditions</h2>
                </div>
              </div>
              <button type="button" className="terms-modal-close" onClick={() => setTermsModalOpen(false)}>✕</button>
            </div>

            <div className="terms-modal-body">
              <p className="terms-modal-intro">By submitting an application, you confirm that you have read and agree to the following terms.</p>

              <div className="terms-modal-sections">
                <div className="terms-modal-section">
                  <span className="terms-modal-icon">📋</span>
                  <div>
                    <strong>Accuracy of Information</strong>
                    <p>All information you provide is accurate, truthful, and complete. False or misleading information may result in disqualification or termination of employment.</p>
                  </div>
                </div>
                <div className="terms-modal-section">
                  <span className="terms-modal-icon">📞</span>
                  <div>
                    <strong>Consent to Contact</strong>
                    <p>You consent to being contacted via the email and phone number provided for application updates, interview schedules, and job offer correspondence.</p>
                  </div>
                </div>
                <div className="terms-modal-section">
                  <span className="terms-modal-icon">🔒</span>
                  <div>
                    <strong>Data Privacy &amp; Confidentiality</strong>
                    <p>Your data is used solely for recruitment, accessible only to authorized HR personnel, stored securely, and never sold or shared with unrelated third parties.</p>
                  </div>
                </div>
                <div className="terms-modal-section">
                  <span className="terms-modal-icon">📁</span>
                  <div>
                    <strong>Document Retention</strong>
                    <p>Your application and CV may be retained for up to 2 years from submission to consider you for future openings. After this period, data is securely deleted.</p>
                  </div>
                </div>
                <div className="terms-modal-section">
                  <span className="terms-modal-icon">⚖️</span>
                  <div>
                    <strong>Your Rights</strong>
                    <p>You may request access, correction, or deletion of your data, and may withdraw your application at any time before a final hiring decision.</p>
                  </div>
                </div>
                <div className="terms-modal-section">
                  <span className="terms-modal-icon">📄</span>
                  <div>
                    <strong>Uploaded Documents</strong>
                    <p>Attached files (CV, certificates) are stored securely and reviewed only by authorized HR staff involved in the hiring process.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="terms-modal-footer">
              <p>Effective date: March 1, 2026</p>
              <button
                type="button"
                className="terms-modal-accept"
                onClick={() => { setTermsAccepted(true); setTermsModalOpen(false) }}
              >
                I Agree &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      <Footer />
    </>
  )
}

export default ApplyPage
