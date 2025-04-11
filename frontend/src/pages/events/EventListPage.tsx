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
  Alert 
} from '@mui/material';
import { 
  Search, 
  CalendarMonth, 
  LocationOn, 
  PersonOutline 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EventService, { Event } from '../../services/event';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// GridコンポーネントをMaterial-UIのバージョンに合わせて使いやすくカスタム
const Grid = MuiGrid;

const EventListPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, [page]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await EventService.getEvents(page);
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
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  const handleRegisterClick = (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/events/${eventId}/register`);
  };

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <Box component="form" onSubmit={handleSearchSubmit} mb={4}>
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
          }}
        />
      </Box>

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
      ) : filteredEvents.length > 0 ? (
        <>
          <MuiGrid container spacing={3}>
            {filteredEvents.map(event => {
              const eventFull = isEventFull(event);
              return (
                <MuiGrid item xs={12} sm={6} md={4} key={event.id}>
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
                </MuiGrid>
              );
            })}
          </MuiGrid>
          
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