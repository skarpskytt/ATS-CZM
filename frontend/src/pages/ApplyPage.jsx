import { useEffect, useState } from 'react'

const initialForm = {
  position_applied_for: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  permanent_address: '',
  gender: '',
  civil_status: '',
  birthdate: '',
  age: '',
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
  { value: 'Other', label: 'Other' }
]

const civilStatusOptions = [
  { value: '', label: 'Select' },
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Widowed', label: 'Widowed' }
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
  const [cvFile, setCvFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [positions, setPositions] = useState([])
  const [positionsLoading, setPositionsLoading] = useState(true)
  const [positionsError, setPositionsError] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)


  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleFileChange = (event) => {
    const [file] = event.target.files
    setCvFile(file || null)
  }

  const buildFormData = () => {
    const formData = new FormData()

    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null) {
        formData.append(key, value)
      }
    })

    if (cvFile) {
      formData.append('upload_cv', cvFile)
    }

    return formData
  }

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
      setCvFile(null)
    } catch (err) {
      setError('Network error. Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="apply-hero">
        <div className="apply-hero-glow glow-left" />
        <div className="apply-hero-glow glow-right" />
        <div className="apply-hero-inner">
          <div className="apply-hero-copy">
            <p className="apply-kicker">CZARK MAK CORPORATION</p>
            <h1 className="apply-title">Apply with confidence.</h1>
            <p className="apply-lead">
              Submit your details and CV. Our recruiters will review your application and update you through email.
            </p>
            <div className="apply-hero-badges">
              <span className="apply-pill">Fast review</span>
              <span className="apply-pill">Secure uploads</span>
              <span className="apply-pill">Email updates</span>
            </div>
          </div>
          <div className="card apply-hero-card">
            <div className="card-body gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1c1a16]">What you need</h2>
                <p className="text-sm text-[#6b5f49]">Bring these details to complete your submission.</p>
              </div>
              <ul className="apply-checklist">
                <li><span />Personal and contact details</li>
                <li><span />Education background</li>
                <li><span />Work experience summary</li>
                <li><span />Latest CV (PDF, DOC, DOCX)</li>
              </ul>
              <div className="apply-note">Fields marked with * are required</div>
            </div>
          </div>
        </div>
      </section>

      <form className="apply-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="card apply-card">
          <div className="card-body apply-card-body">
            <div className="apply-form-header">
              <div>
                <h2 className="apply-form-title">Application Form</h2>
                <p className="apply-form-subtitle">Complete all required fields to submit.</p>
              </div>
            </div>

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
                <input
                  type="date"
                  name="birthdate"
                  value={form.birthdate}
                  onChange={handleChange}
                  required
                  className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Age *</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  min="18"
                  max="120"
                  required
                  placeholder="Enter age"
                  className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg"
                />
              </div>
              </div>
            </div>

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
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" type="number" min="0" name="expected_salary" value={form.expected_salary} onChange={handleChange} />
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
              </div>
            </div>

            <div className="form-section" style={{ '--delay': '240ms' }}>
              <div className="divider apply-divider">Documents</div>
              <div className="grid gap-4 lg:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Upload CV</span>
                </label>
                <input className="file-input file-input-bordered file-input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" type="file" name="upload_cv" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Where did you learn about this vacancy?</span>
                </label>
                <input className="input input-bordered input-lg w-full bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg" name="vacancy_source" value={form.vacancy_source} onChange={handleChange} />
              </div>
              </div>
            </div>

            <div className="form-section" style={{ '--delay': '320ms' }}>
              <div className="divider apply-divider">Terms</div>
              <div className="terms-shell">
                <div className="terms-card">
                  <div>
                    <p className="terms-title">Before you submit</p>
                    <p className="terms-subtitle">
                      Please review the terms below. We use your information strictly for recruitment and keep it secure.
                    </p>
                  </div>
                  <label className="terms-check">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                      className="checkbox checkbox-primary"
                    />
                    <span>
                      I agree to the <a href="#terms" onClick={(e) => e.preventDefault()} className="link link-primary">Terms and Conditions</a>
                    </span>
                  </label>
                </div>
                <div id="terms" className="collapse collapse-arrow bg-base-200">
                  <input type="checkbox" />
                  <div className="collapse-title text-sm font-semibold">Terms and Conditions</div>
                  <div className="collapse-content text-sm">
                    <div className="terms-grid">
                      <div>
                        <h4>Accuracy</h4>
                        <p>You confirm that all information provided is accurate and complete.</p>
                      </div>
                      <div>
                        <h4>Contact</h4>
                        <p>You allow us to contact you by email or phone about your application.</p>
                      </div>
                      <div>
                        <h4>Privacy</h4>
                        <p>Your data is kept confidential and used only for recruitment purposes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section" style={{ '--delay': '400ms' }}>
              <div className="flex flex-col items-center gap-4">
              <button type="submit" disabled={submitting} className={`btn btn-lg btn-wide apply-submit ${submitting ? 'loading' : ''}`}>
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
              {message ? (
                <div className="alert alert-success" role="alert">
                  <span>{message}</span>
                </div>
              ) : null}
              {error ? (
                <div className="alert alert-error" role="alert">
                  <span>{error}</span>
                </div>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}

export default ApplyPage
