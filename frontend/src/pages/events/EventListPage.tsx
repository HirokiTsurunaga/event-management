import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardMedia, 
  CardContent, 
  Stack, 
  Button, 
  TextField, 
  InputAdornment, 
  Grid as MuiGrid,
  Pagination, 
  CircularProgress, 
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  SelectChangeEvent
} from '@mui/material';
import { 
  Search, 
  CalendarMonth, 
  LocationOn, 
  PersonOutline,
  ExpandMore,
  FilterList,
  Sort
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EventService, { Event, EventSearchParams } from '../../services/event';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// MuiGridと通常のdivの代わりに使うカスタムグリッドコンポーネント
const Grid = (props: any) => <MuiGrid {...props} />;
const GridItem = (props: any) => <MuiGrid item {...props} />;

const EventListPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 検索・フィルタリング状態
  const [searchParams, setSearchParams] = useState<EventSearchParams>({
    page: 1,
    per_page: 10,
    sort_by: 'start_date',
    sort_dir: 'asc'
  });
  
  // 詳細フィルターの表示状態
  const [showFilters, setShowFilters] = useState(false);
  
  // 日付フィルター
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  
  // 参加可能イベントのみ表示
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [searchParams]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await EventService.getEvents(searchParams);
      setEvents(response.events.data);
      setTotalPages(Math.ceil(response.events.total / response.events.per_page));
    } catch (err) {
      console.error('イベント情報の取得中にエラーが発生しました', err);
      setError('イベント情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setSearchParams({
      ...searchParams,
      page: value
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams({
      ...searchParams,
      search: searchQuery,
      page: 1
    });
  };
  
  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    const [sort_by, sort_dir] = value.split(':');
    
    setSearchParams({
      ...searchParams,
      sort_by: sort_by as 'name' | 'start_date' | 'location' | 'created_at',
      sort_dir: sort_dir as 'asc' | 'desc',
      page: 1
    });
  };
  
  const handleAvailableOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setAvailableOnly(checked);
    
    setSearchParams({
      ...searchParams,
      available_only: checked,
      page: 1
    });
  };
  
  const handleDateFromChange = (date: Date | null) => {
    setDateFrom(date);
    
    setSearchParams({
      ...searchParams,
      date_from: date ? format(date, 'yyyy-MM-dd') : undefined,
      page: 1
    });
  };
  
  const handleDateToChange = (date: Date | null) => {
    setDateTo(date);
    
    setSearchParams({
      ...searchParams,
      date_to: date ? format(date, 'yyyy-MM-dd') : undefined,
      page: 1
    });
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFrom(null);
    setDateTo(null);
    setAvailableOnly(false);
    
    setSearchParams({
      page: 1,
      per_page: 10,
      sort_by: 'start_date',
      sort_dir: 'asc'
    });
  };

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  const handleRegisterClick = (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/events/${eventId}/register`);
  };

  // イベントが定員に達しているかどうかを確認する関数
  const isEventFull = (event: Event): boolean => {
    return Boolean(event.capacity && 
      event.participant_count && 
      event.participant_count >= event.capacity);
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          イベント一覧
        </Typography>
        <Typography variant="body1" color="text.secondary">
          参加したいイベントを探してみましょう
        </Typography>
      </Box>

      {/* 検索フォーム */}
      <Box component="form" onSubmit={handleSearchSubmit} mb={2}>
        <TextField
          fullWidth
          placeholder="イベント名や場所で検索"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="small"
                  sx={{ borderRadius: '20px' }}
                >
                  検索
                </Button>
                <IconButton 
                  color="primary" 
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ ml: 1 }}
                >
                  <FilterList />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      {/* 詳細フィルター */}
      <Accordion 
        expanded={showFilters} 
        onChange={() => setShowFilters(!showFilters)}
        sx={{ mb: 3, borderRadius: 1, boxShadow: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight="bold">詳細フィルター</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Grid container spacing={2}>
              <GridItem xs={12} md={4}>
                <DatePicker
                  label="開始日（から）"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </GridItem>
              <GridItem xs={12} md={4}>
                <DatePicker
                  label="開始日（まで）"
                  value={dateTo}
                  onChange={handleDateToChange}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </GridItem>
              <GridItem xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="sort-select-label">並び順</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    id="sort-select"
                    value={`${searchParams.sort_by || 'start_date'}:${searchParams.sort_dir || 'asc'}`}
                    label="並び順"
                    onChange={handleSortChange}
                  >
                    <MenuItem value="start_date:asc">開催日（近い順）</MenuItem>
                    <MenuItem value="start_date:desc">開催日（遠い順）</MenuItem>
                    <MenuItem value="name:asc">イベント名（昇順）</MenuItem>
                    <MenuItem value="name:desc">イベント名（降順）</MenuItem>
                    <MenuItem value="location:asc">開催場所（昇順）</MenuItem>
                    <MenuItem value="created_at:desc">新着順</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem xs={12}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <FormControlLabel 
                    control={
                      <Checkbox 
                        checked={availableOnly} 
                        onChange={handleAvailableOnlyChange} 
                      />
                    } 
                    label="参加可能なイベントのみ表示" 
                  />
                  <Button 
                    variant="outlined" 
                    onClick={handleClearFilters}
                    startIcon={<FilterList />}
                  >
                    フィルターをクリア
                  </Button>
                </Box>
              </GridItem>
            </Grid>
          </LocalizationProvider>
        </AccordionDetails>
      </Accordion>
      
      {/* アクティブフィルターの表示 */}
      {(searchParams.search || searchParams.date_from || searchParams.date_to || searchParams.available_only) && (
        <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
          {searchParams.search && (
            <Chip 
              label={`検索: ${searchParams.search}`} 
              onDelete={() => setSearchParams({...searchParams, search: undefined})}
              color="primary"
              variant="outlined"
            />
          )}
          {searchParams.date_from && (
            <Chip 
              label={`開始日から: ${format(new Date(searchParams.date_from), 'yyyy/MM/dd')}`} 
              onDelete={() => handleDateFromChange(null)}
              color="primary"
              variant="outlined"
            />
          )}
          {searchParams.date_to && (
            <Chip 
              label={`開始日まで: ${format(new Date(searchParams.date_to), 'yyyy/MM/dd')}`} 
              onDelete={() => handleDateToChange(null)}
              color="primary"
              variant="outlined"
            />
          )}
          {searchParams.available_only && (
            <Chip 
              label="参加可能なイベントのみ" 
              onDelete={() => handleAvailableOnlyChange({target: {checked: false}} as any)}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* イベント一覧 */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : events.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {events.map(event => {
              const eventFull = isEventFull(event);
              return (
                <GridItem xs={12} sm={6} md={4} key={event.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6,
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleEventClick(event.id)}
                  >
                    {/* 状態バッジ */}
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10, 
                        zIndex: 1,
                        bgcolor: eventFull ? 'error.main' : 'success.main',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 5,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: 1
                      }}
                    >
                      {eventFull ? '満員' : '参加可能'}
                    </Box>

                    <CardMedia
                      component="img"
                      height="140"
                      image={event.image_path ? `http://localhost:8000/storage/${event.image_path}` : '/event-placeholder.jpg'}
                      alt={event.name}
                      sx={{
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 'bold', height: '3rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {event.name}
                      </Typography>
                      
                      <Stack spacing={1.5} my={2}>
                        <Box display="flex" alignItems="center">
                          <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {(() => {
                              try {
                                const date = new Date(event.start_date);
                                if (isNaN(date.getTime())) {
                                  return '日付情報なし';
                                }
                                return format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja });
                              } catch (error) {
                                console.error('日付のフォーマット中にエラーが発生しました:', error);
                                return '日付情報なし';
                              }
                            })()}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center">
                          <LocationOn fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" noWrap>
                            {event.location}
                          </Typography>
                        </Box>
                        
                        {event.capacity && (
                          <Box display="flex" alignItems="center">
                            <PersonOutline fontSize="small" sx={{ mr: 1, color: eventFull ? 'error.main' : 'primary.main' }} />
                            <Typography variant="body2" fontWeight={eventFull ? 'bold' : 'normal'}>
                              {event.participant_count || 0} / {event.capacity} 人
                              {!eventFull && event.capacity && (
                                <Box component="span" sx={{ color: 'success.main', ml: 1, fontWeight: 'bold' }}>
                                  残り{event.capacity - (event.participant_count || 0)}席
                                </Box>
                              )}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                      
                      <Box mt={2} display="flex" justifyContent="flex-end">
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={(e) => handleRegisterClick(event.id, e)}
                          disabled={eventFull}
                          sx={{
                            borderRadius: 4,
                            px: 2,
                            boxShadow: 2
                          }}
                        >
                          {eventFull ? '満員' : '参加登録'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>
              );
            })}
          </Grid>
          
          <Box display="flex" justifyContent="center" mt={4} mb={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      ) : (
        <Box textAlign="center" my={5}>
          <Typography variant="h6" color="text.secondary">
            イベントが見つかりませんでした
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            検索条件を変更してもう一度お試しください
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EventListPage; 