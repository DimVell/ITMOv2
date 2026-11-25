import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Alert, Avatar, Box, Button, Card, Chip, CircularProgress, Container,
  List, ListItem, ListItemAvatar, ListItemText, Skeleton, Stack, TextField, Typography,
} from '@mui/material';
import { addSubscriber, listSubscribers, validateName, type Subscriber } from './api';

function PeopleIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m3 9v-2a6 6 0 0 0-3-5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>;
}

export default function App() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [validation, setValidation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);
  const sending = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const loadSequence = useRef(0);

  async function load() {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError('');
    try {
      const items = await listSubscribers();
      if (sequence === loadSequence.current) setSubscribers(items);
    } catch (error) {
      if (sequence === loadSequence.current) setLoadError((error as Error).message);
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    return () => { loadSequence.current += 1; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || loading || loadError) return;
    const problem = validateName(name);
    setValidation(problem || '');
    setNotice(null);
    if (problem) {
      nameInput.current?.focus();
      return;
    }
    sending.current = true;
    setSubmitting(true);
    try {
      const result = await addSubscriber(name);
      if (result.created) {
        setSubscribers(current => [...current.filter(s => s.name !== result.subscriber.name), result.subscriber]
          .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })));
      }
      setName('');
      setNotice({
        kind: result.created ? 'success' : 'info',
        text: result.created
          ? `${result.subscriber.name} — подписчик добавлен.`
          : `${result.subscriber.name} уже в списке. Повторная запись не создана.`,
      });
    } catch (error) {
      setNotice({ kind: 'error', text: (error as Error).message });
    } finally {
      sending.current = false;
      setSubmitting(false);
      requestAnimationFrame(() => nameInput.current?.focus());
    }
  }

  return (
    <Box className="app-shell">
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      <Box component="header" className="topbar">
        <Container maxWidth="lg" className="topbar-content">
          <a className="brand" href="/" aria-label="Notify Mini — главная">
            <span className="brand-mark"><PeopleIcon size={22} /></span>
            <span>notify<span className="brand-mini">mini</span></span>
          </a>
          <span className="workspace-label">Ваше пространство для связи</span>
        </Container>
      </Box>

      <Container component="main" id="main" maxWidth="lg" className="main-content">
        <Box className="page-heading">
          <Box>
            <Typography component="p" className="eyebrow">ВАША АУДИТОРИЯ</Typography>
            <Typography component="h1" variant="h1">Ближе к вашим людям.</Typography>
            <Typography color="text.secondary" className="page-description">
              Добавляйте подписчиков и собирайте свою аудиторию в одном месте.
            </Typography>
          </Box>
          <Card className="total-card" aria-label="Количество подписчиков">
            <span className="total-icon"><PeopleIcon /></span>
            <Box>
              <Typography color="text.secondary" variant="body2">Всего подписчиков</Typography>
              <Typography component="p" className="total-number" data-testid="subscriber-count">
                {loading ? '…' : loadError ? '—' : subscribers.length}
              </Typography>
            </Box>
          </Card>
        </Box>

        <Box className="workspace-grid">
          <Box>
            <Card className="form-card">
              <span className="section-symbol" aria-hidden="true">＋</span>
              <Typography component="h2" variant="h2">Новый подписчик</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Всё начинается со знакомства. Как зовут вашего подписчика?
              </Typography>
              <Box component="form" onSubmit={submit} noValidate aria-busy={submitting}>
                <TextField
                  id="subscriber-name"
                  label="Имя подписчика"
                  value={name}
                  inputRef={nameInput}
                  disabled={submitting}
                  error={Boolean(validation)}
                  helperText={validation || 'От 1 до 40 символов. Например, Анна Иванова.'}
                  onChange={event => {
                    setName(event.target.value);
                    if (validation) setValidation('');
                    if (notice) setNotice(null);
                  }}
                  autoComplete="off"
                />
                <Button type="submit" variant="contained" fullWidth
                  disabled={submitting || loading || Boolean(loadError)}
                  sx={{ mt: 2.5 }}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <span aria-hidden="true">＋</span>}>
                  {submitting ? 'Добавляем…' : 'Добавить подписчика'}
                </Button>
                {submitting && <span className="sr-only" role="status">Сохраняем подписчика</span>}
              </Box>
              {notice && <Alert severity={notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'} sx={{ mt: 2.5 }}>
                {notice.text}
              </Alert>}
            </Card>
            <Box className="reassurance">
              <span className="reassurance-icon" aria-hidden="true">✓</span>
              <Typography variant="body2" color="text.secondary">
                Список сохраняется автоматически. Подписчики останутся на месте после обновления страницы.
              </Typography>
            </Box>
          </Box>

          <Card className="subscribers-card" component="section" aria-labelledby="list-title">
            <Box className="list-heading">
              <Typography component="h2" variant="h2" id="list-title">Подписчики</Typography>
              {!loading && !loadError && <Chip label={subscribers.length} size="small" aria-label={`${subscribers.length} в списке`} />}
            </Box>
            {loading ? <Box className="list-loading" role="status" aria-label="Загружаем подписчиков">
              {[0, 1, 2].map(i => <Stack key={i} direction="row" spacing={2} sx={{ py: 1.5, alignItems: 'center' }}>
                <Skeleton variant="circular" width={42} height={42} />
                <Skeleton variant="text" width={`${48 - i * 8}%`} height={28} />
              </Stack>)}
            </Box> : loadError ? <Box className="empty-panel">
              <span className="empty-icon error-icon" aria-hidden="true">!</span>
              <Typography component="h3" variant="h2">Не удалось загрузить список</Typography>
              <Typography role="alert" color="text.secondary" sx={{ mt: 1.5, maxWidth: 350 }}>{loadError}</Typography>
              <Button variant="outlined" onClick={() => void load()} sx={{ mt: 3 }}>Повторить загрузку</Button>
            </Box> : subscribers.length === 0 ? <Box className="empty-panel">
              <Box className="people-art" aria-hidden="true">
                <span className="people-art-orbit" />
                <span className="people-art-dot" />
                <PeopleIcon size={50} />
              </Box>
              <Typography component="h3" variant="h2">Здесь начинается ваша аудитория</Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 330 }}>
                Пока список пуст. Добавьте первого подписчика с помощью формы.
              </Typography>
              <Chip label="Первое знакомство — первый шаг" variant="outlined" size="small" sx={{ mt: 3, color: 'text.secondary' }} />
            </Box> : <>
              <Box className="column-labels"><span>ИМЯ</span><span>СТАТУС</span></Box>
              <List disablePadding aria-label="Список подписчиков">
                {subscribers.map((subscriber, index) => <ListItem key={subscriber.name} className="subscriber-row"
                  secondaryAction={<Chip label="Подписан" size="small" className="subscribed-chip" />}>
                  <ListItemAvatar><Avatar className={`person-avatar avatar-${index % 4}`}>
                    {subscriber.name.split(/\s+/).slice(0, 2).map(part => [...part][0]).join('').toLocaleUpperCase('ru')}
                  </Avatar></ListItemAvatar>
                  <ListItemText primary={subscriber.name} slotProps={{ primary: { sx: { fontWeight: 550, overflowWrap: 'anywhere' } } }} />
                </ListItem>)}
              </List>
              <Box className="list-footer"><span className="footer-check" aria-hidden="true">✓</span> Ваш список актуален</Box>
            </>}
          </Card>
        </Box>
        <Box component="footer" className="page-footer">
          <span>Notify Mini</span><span>Маленький инструмент. Больше связи.</span>
        </Box>
      </Container>
    </Box>
  );
}
