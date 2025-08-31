import React from 'react';
import { useNavigationLoading } from '../hooks/useNavigationLoading';
import Loading from './Loading';

export default function NavigationLoading() {
  const { isLoading } = useNavigationLoading();

  if (!isLoading) return null;

  return <Loading />;
} 